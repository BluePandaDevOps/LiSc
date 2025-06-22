
import { getKeywordList, getAllHTMLpages } from '../data/builder_parser_store.js';

function regexContext(html, keyword) {
  let output = '';
  const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, 'gi');
  const matches = html.match(regex);
  if (matches) {
    matches.forEach(m => {
      output += `[...]${m}[...]\n`;
    });
  } else {
    output += `--- No match for "${keyword}" ---\n`;
  }

  output += '\n';
  return output;
}


export async function parseHTMLsforKeywords() {
  //try {
  const patterns = await getKeywordList();
  const htmlPages = await getAllHTMLpages();


  const parsedResponses = [];

  if (Array.isArray(htmlPages) && htmlPages.length > 0 &&
    Array.isArray(patterns) && patterns.length > 0) {
    htmlPages.forEach((page, index) => {
      const matches = [];
      patterns.forEach((pattern, index) => {
        if (page.url === pattern.url) {
          matches.push({ pattern: pattern, html: page.HTML });
        }
      });
      matches.forEach((patternsAndHtml) => {
        let pathsAndContext = []
        const paths = parsePatternOnPage(patternsAndHtml);
        paths.forEach(pathAndText => {
          const context = regexContext(pathAndText.text, patternsAndHtml.pattern.pattern)
          pathsAndContext.push({ path: pathAndText.path, context: context })
        });

        parsedResponses.push({
          url: page.url,
          type: patternsAndHtml.pattern.type,
          pattern: patternsAndHtml.pattern.pattern,
          pathsAndContext: pathsAndContext
        });
      });
    });
  };
  return parsedResponses;
}

export function getElementByPathFromHTML(htmlText, path, returnParent = false) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  try {
    const element = doc.querySelector(path);
    if (!element) return null;

    const target = returnParent ? element.parentElement : element;
    return target;
  } catch (err) {
    console.log('Invalid selector path:', path);
    return null;
  }
}


export async function calculateSuccessPerPath(path) {
  let successCounter = 0;
  let failureCounter = 0;
  try {
    const htmls = await getAllHTMLpages();
    if (Array.isArray(htmls) && htmls.length > 0) {
      htmls.forEach((html, index) => {
        const result = getElementByPathFromHTML(html.HTML, path);
        if (result) {
          successCounter += 1;
        } else {
          failureCounter += 1;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load keyword entries:', error);
  }
  return { successCounter: successCounter, failureCounter: failureCounter }
}

export function debugSelectorPath(htmlString, selectorPath) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const segments = selectorPath.split('>').map(s => s.trim());

  let currentElement;

  // Set starting point
  if (segments[0] === 'html') {
    currentElement = doc.documentElement;
  } else if (segments[0] === 'body') {
    currentElement = doc.body;
  } else {
    currentElement = doc;
  }

  let currentPath = '';
  let validUntil = -1;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath = currentPath ? `${currentPath} > ${segment}` : segment;

    // Skip if we're already pointing at it
    if (
      (i === 0 && segment === 'html') ||
      (i === 0 && segment === 'body')
    ) {
      validUntil = i;
      continue;
    }

    const nextElement = currentElement.querySelector(segment);
    if (!nextElement) {
      return {
        success: false,
        validUntil,
        failedSegment: segment,
        validPath: segments.slice(0, validUntil + 1).join(' > ') || null,
        failedPath: currentPath
      };
    }

    currentElement = nextElement;
    validUntil = i;
  }

  return {
    success: true,
    validUntil: segments.length - 1,
    validPath: selectorPath,
    failedSegment: null,
    failedPath: null
  };
}

function parsePatternOnPage(patternsAndHtml) {
  const pattern = patternsAndHtml.pattern.pattern;
  const html = patternsAndHtml.html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const walker = document.createTreeWalker(
    doc,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) =>
        node.nodeValue.includes(pattern)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP
    }
  );

  const matches = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    const paths = [];
    let current = node.parentElement;

    while (current && current.tagName.toLowerCase() !== 'html') {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const classes = current.classList.length
        ? `.${[...current.classList].join('.')}`
        : '';

      // 🆕 Add :nth-of-type(n) if needed
      let nth = '';
      const parent = current.parentElement;
      if (parent) {
        const sameTypeSiblings = Array.from(parent.children).filter(
          (el) => el.tagName === current.tagName
        );
        if (sameTypeSiblings.length > 1) {
          const index = sameTypeSiblings.indexOf(current) + 1;
          nth = `:nth-of-type(${index})`;
        }
      }

      paths.unshift(`${tag}${id}${classes}${nth}`);
      current = current.parentElement;
    }

    matches.push({
      text: node.nodeValue.trim(),
      path: paths.map(escapeSelectorSegment).join(' > ')
    });
  }

  return matches;
}


function escapeSelectorSegment(segment) {
  // Temporarily remove all :nth-of-type(n) matches and store their positions
  const nthMatches = [];
  const cleaned = segment.replace(/:nth-of-type\(\d+\)/g, (match) => {
    nthMatches.push(match);
    return `___NTH_PLACEHOLDER_${nthMatches.length - 1}___`;
  });

  // Escape everything else
  const escaped = cleaned
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

  // Restore :nth-of-type placeholders
  return nthMatches.reduce(
    (str, nth, index) => str.replace(`___NTH_PLACEHOLDER_${index}___`, nth),
    escaped
  );
}