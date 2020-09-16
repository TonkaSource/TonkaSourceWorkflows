(() => {
    const _getMemberId = async () => {
        await tsCommon.sleep(2000);

        const codeElement = tsUICommon.findDomElement('code:contains("urn:li:member:")');
        if (!codeElement){
            return null;
        }

        const jsonString = $(codeElement).text();
        const lookFor = "\"trackingUrn\":\"urn:li:member:";
        
        let startIndex = jsonString.indexOf(lookFor);
        if (startIndex === -1){
            return null;
        }

        startIndex+= lookFor.length;
        const endIndex = jsonString.indexOf("\"", startIndex);
        if (endIndex === -1){
            return null;
        }

        return jsonString.substr(startIndex, endIndex - startIndex);
    }

    const _scrapeFirstAndLastNameFromProfile = () => {
        let element = tsUICommon.findFirstDomElement(['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")']);
        if (element === null){
            return;
        }

        let wholeName = $(element).text();
        ["Connect with", "profile via message", "profile to PDF", "Report or block", "'s"].forEach((remove) => {
            wholeName = wholeName.split(remove).join('');
        })

        const firstAndLast = wholeName.split(' ');
        if (firstAndLast.length > 1){
            return {
                firstName: firstAndLast[0],
                lastName: firstAndLast[firstAndLast.length -1]
            }
        }
    }

    const _scrapeProfile = async () => {
        if (window.location.href.indexOf('.com/in/') === -1){
            return null;
        }

        const result = {
            memberId: await _getMemberId(),
        }

        const firstAndLast = _scrapeFirstAndLastNameFromProfile();
        if (firstAndLast != null){
            result.firstName = firstAndLast.firstName;
            result.lastName = firstAndLast.lastName;
        }
        
        return result;
    }

    class LinkedInPublicProfile {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;        
    }

    window.linkedInPublicProfile = new LinkedInPublicProfile();

})();
