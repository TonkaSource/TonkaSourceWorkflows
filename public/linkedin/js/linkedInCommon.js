(function() {
    const _advanceToNextLinkedInResultPage = () => {
        const buttonExists = $("[type='chevron-right-icon']").length;
        if (buttonExists){
            tsCommon.log("advancing to the next page");
            $("[type='chevron-right-icon']").click();
            return true;
        }

        return false;
    }

    const _callAlisonHookWindow = async (actionString, data) => {
        await window.launchTonkaSource();
        await tsCommon.sleep(3000);

        if (window.alisonHookWindow){
            try {
                const jsonData = JSON.stringify(data);
                tsCommon.postMessageToWindow(window.alisonHookWindow, actionString, jsonData);
            }
            catch(postError) {
                tsCommon.log(`Error posting message to alison hook (check pop up blocker?). ${e.message}.  (${e})`, 'ERROR');
            }
        }
        else {
            tsCommon.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()? Check Pop up blocker?)");
        }
    }

    const _getRoleName = (roleName) => {
        if (linkedInConstants.roles[roleName.toUpperCase()]) {
            return linkedInConstants.roles[roleName.toUpperCase()];
        } else {
            tsCommon.log({
                message: "Role Not Defined",
                roles: linkedInConstants.roles
            }, "WARN");
        }
        return null;
    }

    const _whatPageAmIOn = () => {
        const href = window.location.href.toLowerCase();
        let result = null;

        if (href === "https://www.linkedin.com/" || href === "https://www.linkedin.com"){
            return linkedInConstants.pages.LOGIN;
        }

        for(let key in linkedInConstants.pages){
           let pageConst = linkedInConstants.pages[key];
           if (href.indexOf(pageConst) >= 0){
               result = pageConst;
               break;
           }
        }

        if (!result){
            tsCommon.log(`whatPageAmIOn = null (href: ${href})`);
        }

        return result;
    }

    const _parseJobDurationDateRangeString = (text) => {
        try {
            const dateParts = text.split('–').map(d => d.trim());
            const startDate = new Date(dateParts[0]);

            const result = {
                startDateMonth: startDate.getMonth() + 1,
                startDateYear: startDate.getFullYear()
            }

            if (dateParts[1].toLowerCase().indexOf('present') === -1){
                const endDate = new Date(dateParts[1]);
                result.endDateMonth = endDate.getMonth() + 1;
                result.endDateYear = endDate.getFullYear();
            }

            return result;
        } catch (e) {
            return null;
        }
    }

    class LinkedInCommon {
        constructor() {}

        advanceToNextLinkedInResultPage = _advanceToNextLinkedInResultPage;
        getRoleName = _getRoleName;
        callAlisonHookWindow = _callAlisonHookWindow;
        whatPageAmIOn = _whatPageAmIOn;
        parseJobDurationDateRangeString = _parseJobDurationDateRangeString;
    }

    window.linkedInCommon = new LinkedInCommon();
})();