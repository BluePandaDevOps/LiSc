# Lovely Information Support companion

Are you browing the same website a lot and copy past stuff into a CSV file? 

LiSc might be helpful for you. It is a FireFox plugin which lets you access html code directly, let you implement the parsing and storing what you parsed into a database.


## Steps 

 - Create a config.json files. (You can copy config_example.json).
 - Adjust the scope of what pages you want to analyse by adjusting the allowedSites in the config file.
 - Load the manifest.json with FireFox as an extension.
 - Open the plugin and open the LiSc through the popup.
 - Go through the flow of:
    - Collect html pages.
    - Define pattern to match in a couple of cases.
    - Match the pattern, see if it fits on other webpages as well and choose your selection.
    - Improve the matched output.
    - Validate the results and move them to the database.
    - Export the data in csv for persistence.

## Adjusting the config

Mentioning the domain without the TLD is fine, since often social media sites might serve different profiles in different countries under dedicated TLDs. Therefore it does not match on subdomains or TLDs and assumes all of them are in scope.
```json
{
  "allowedSites": [
    "example"
  ],

...
```


## Version 0.1 (Alpha). Use at your own risk. 


