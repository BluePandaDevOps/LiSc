
export function parseHTML(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

    scripts.forEach(script => {
    try {
        const json = JSON.parse(script.textContent);
        if (json['@context'] === 'http://schema.org' && json['@graph']) {
        console.log('Found JSON-LD @graph object:', json);
        }
    } catch (e) {
        console.warn('Invalid JSON in script tag', e);
    }
    });
}

export function parseHTML2(htmlContent) {
    

    console.log('HTML for prasing delivered. Lengthof HTML: '+ htmlContent.length)
    if(!htmlContent){
        return null
    }

    const parser = new DOMParser();
    const doc_main = parser.parseFromString(htmlContent, "text/html");
    

    if (!doc_main){
        console.log('.main was not found')
        return null
    }



    
    let profileName = cleanText(parseProfileName(doc_main))
    let position = cleanText(parsePosition(doc_main))
    let location = cleanText(parseLocation(doc_main))
    let company = cleanText(parseCompany(doc_main))
    let aboutText = cleanText(parseAbout(doc_main))
    let experienceLatest = cleanText(parseExperience(doc_main))

    console.log(`parseHTML ${experienceLatest}`)


    if (!profileName || !position || !location || !company) {
        const topcard = parseAllThroughTopCardOrder(doc_main);
    
        
        profileName = topcard.profileName || profileName;
        position = topcard.position || position;
        location = topcard.location || location;
        company = topcard.company || company;
    }
    
    
    return {
        profileName,
        position,
        location,
        company,
        aboutText,
        experienceLatest
    };
}

function parseAllThroughTopCardOrder(doc) {
    


    
    function parseAllThroughTopCardOrder_implicit(doc){

        const topcard = {
            profileName: null,
            position: null,
            location: null,
            company: null,
        };
        
        const elements = doc.querySelector('div.mt2.relative');
    
        if (!elements) {
            console.error("Top card elements not found");
            return topcard; 
        }

        
        const texts = getLeafNodeText(elements);
        if (texts.length > 2) {
            topcard.profileName = texts[0];
            topcard.position = texts[1];
            topcard.company = texts[2];
        }

        
        const indexOfKontaktInfo = texts.findIndex(item => item.includes('Contact info'));
        if (indexOfKontaktInfo >= 1) {
            topcard.location = texts[indexOfKontaktInfo - 1];
        }

        return topcard; 
        
    }

    function parseAllThroughTopCardOrder_explicit(doc){

        const topcard = {
            profileName: null,
            position: null,
            location: null,
            company: null,
        };
        
        const elements = doc.querySelector('div.mt2.relative');
    
        if (!elements) {
            console.error("Top card elements not found");
            return topcard; 
        }
        topcard.profileName = doc.querySelector('div.top-card-layout__title');
        topcard.position = doc.querySelector('div.top-card-layout__headline');
        topcard.company = doc.querySelector('div.top-card-layout__currentPositionDetails');

        const subline = doc.querySelector('div.top-card-layout__first-subline');
        if (subline && subline.children.length > 0) {
            topcard.location = subline.children[0].textContent.trim();
        } else {
            console.warn("Location not found");
        }

        return topcard; 
        
    }


    const elements = doc.querySelector('div.top-card-layout__entity-info-container');


    //return parseAllThroughTopCardOrder_implicit(doc)
    return parseAllThroughTopCardOrder_explicit(doc)
}



function getLeafNodeText(element) {
    const leafTexts = []; 
    function traverseElements(element) {
        
        if (element.children && element.children.length > 0) {
            
            for (let child of element.children) {
                traverseElements(child);  
            }
        } else {
            
            const text = element.textContent.trim();
            if (text) { 
                leafTexts.push(text);
            }
        }
    }
    traverseElements(element); 
    return leafTexts; 
}
function cleanText(inputText) {
    if(inputText){
        return inputText
        .replace(/\n+/g, '\n')  
        .replace(/\n\s+/g, '\n')
        .trim(); 
    }
    return null

  }

function parseProfileName(doc){
    const nameTag = doc.querySelector('h1'); 
    return nameTag ? nameTag.textContent.trim() : null;
    
}


function parsePosition(doc){

    const h1Element = doc.querySelector('h1');

    let currentElement = h1Element ? h1Element.parentElement : null;
    let h2Text = null;
    
    while (currentElement) {
        if (currentElement.tagName === 'H2' || 
            currentElement.classList.contains('text-body-medium')
        ) {
            h2Text = currentElement.textContent.trim();
            break;
        }
        currentElement = currentElement.nextElementSibling;
    }
    return h2Text
}

function parseLocation(doc){
    const profileSection = doc.querySelector('section.profile');
    if (!profileSection) return null; 

    
    const locationHeadings = Array.from(profileSection.querySelectorAll('h3')); 
    if (locationHeadings && locationHeadings[0].firstElementChild &&  locationHeadings[0].firstElementChild.firstElementChild) {
        const nextDiv = locationHeadings[0].firstElementChild.firstElementChild; 
        if (nextDiv && nextDiv.tagName === 'DIV') {
            
            return nextDiv.textContent.trim();
        }
    }
    return null; 
}



function parseCompany(doc){
    const companyTag = doc.querySelector('[data-section="currentPositionsDetails"]');
    return companyTag ? companyTag.textContent.trim() : null;
}

/*
function parseAbout(doc){

    const aboutH2 = Array.from(doc.querySelectorAll('h2')).find(h2 =>
        h2.textContent.includes('About')
    );
    
    if (aboutH2) {
        
        const nextDiv = aboutH2.nextElementSibling;
        if (nextDiv && nextDiv.tagName === 'DIV') {
            return nextDiv.textContent.trim();
        }
    }
    return null
}
*/
function parseAbout(doc){
    let aboutText = null;
    const aboutH2 = Array.from(doc.querySelectorAll('H2')).find(h2 =>
        h2.textContent.includes('About')
    );
    const aboutTextDiv = findClosestSectionFromH2(aboutH2)
    
   
    if (aboutTextDiv){
        aboutText = aboutTextDiv.textContent.trim()
    }
    if(aboutTextDiv){
        console.log(`about Text: ${aboutText.slice(0,10 )}`)
    }else {
        console.log(`No about Text`)
    }
    return aboutText
}


function parseExperience(doc){
    let experienceText = null;
    const experienceH2 = Array.from(doc.querySelectorAll('H2')).find(h2 =>
        h2.textContent.includes('Experience')
    );
    const experienceTextDiv = findClosestSectionFromH2(experienceH2)
    
   
    if (experienceTextDiv){
        experienceText = experienceTextDiv.textContent.trim()
    }
    if(experienceText){
        console.log(`Exp Text: ${experienceText.slice(0,10 )}`)
    } else {
        console.log(`No exp Text`)
    }
    return experienceText
}


function findClosestSectionFromH2(h2Element) {
    if (!h2Element) {
        console.error("No h2 element provided");
        return null;
    }

    let currentElement = h2Element;

    
    while (currentElement) {
        if (currentElement.tagName === 'SECTION') {
            return currentElement; 
        }
        currentElement = currentElement.parentElement; 
    }

    
    console.warn("No section ancestor found for the provided h2 element");
    return null;
}

function findNextDivAfterText(rootElement, targetText) {
    if (!rootElement) {
        console.error("Root element is required.");
        return null;
    }

    
    const divs = Array.from(rootElement.querySelectorAll('div'));

    let foundTarget = false;

    for (let div of divs) {
        
        if (div.parentElement !== rootElement) {
            continue;
        }

        
        if (foundTarget) {
            return div; 
        }

        if (div.textContent.trim().includes(targetText)) {
            foundTarget = true; 
        }
    }

    
    console.warn(`No div found after the one containing "${targetText}".`);
    return null;
}
