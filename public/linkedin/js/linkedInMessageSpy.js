(() => {
    let __lastEdittableDiv = null;

    const _getNumberOfMessageWindows = () => {
        return $('div[class*="msg-form__contenteditable"]').length;
    }

    const _getFirstAndLastName = (peerElement) => {
        let result = {firstName: '', lastName: ''};

        const headerSpan = tsUICommon.findPreviousElement(peerElement, 'h4 span');
        if (headerSpan != null){
            const firstAndLastName = headerSpan[0].textContent.trim().split(' ');
            result.firstName = firstAndLastName[0];
            result.lastName = firstAndLastName.length > 1? firstAndLastName[1] : '';
        }

        return result;
    }

    const _attachTemplateProcessingListenerToMessageObjects = async () => {
        await tsCommon.sleep(1000);

        const editableDiv = tsUICommon.findDomElement('div[class*="msg-form__contenteditable"]');
        if (editableDiv == null){
            return;
        }

        try {
            $(editableDiv).unbind('DOMSubtreeModified');
        }
        catch {}

        try {
            $(editableDiv).bind('DOMSubtreeModified', function(){
                    __lastEdittableDiv = this;
                    if (this.outerText.trim().length > 0 && this.outerText.indexOf('[firstName]') >= 0){
                        const recipientName = _getFirstAndLastName(this);
                        let text = this.innerHTML.split('[firstName]').join(recipientName.firstName);
                        if (text != this.innerHTML){
                            this.innerHTML = text;
                        }
                    }
            });
        }
        catch {}

       try {
            $('button[class*="msg-form__send-button"]').unbind('click');
       }
       catch {}

       try {
            $('button[class*="msg-form__send-button"]').bind('click', () => {
                    const recipientName = _getFirstAndLastName(__lastEdittableDiv);
                    const messageText = $(__lastEdittableDiv).html();

                    linkedInCommon.callAlisonHookWindow('linkedInMessageWasSent_EvtHandler', {recipientName, messageText, type:'linkedInMessage'});
            }); 
       }
       catch {}
    }      
    

    class LinkedInMessageSpy {
        constructor() {
            if (window.location.href.toLowerCase().indexOf('.linkedin.com/in/') > 0){
                console.log("Spy is spying - good news!");

                this.numberOfMessageWindows = _getNumberOfMessageWindows();
                
                $(document).bind('DOMSubtreeModified', () => {
                    const currentNumberOfMessageWindows = _getNumberOfMessageWindows();
                    if (this.numberOfMessageWindows !== currentNumberOfMessageWindows){
                        _attachTemplateProcessingListenerToMessageObjects();
                        this.numberOfMessageWindows = currentNumberOfMessageWindows;
                    }
                });
            }
        }
    }

    window.linkedInMessageSpy = new LinkedInMessageSpy();
})();