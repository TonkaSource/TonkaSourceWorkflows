(() => {
    const _objectStoreName = 'candidate';
    const _keyPropertyName = 'memberId';

    const _mergePositions = (existingPositions, incomingPositions) => {
        const result = existingPositions ? existingPositions : [];
        if (!incomingPositions){
            return result;
        }

        incomingPositions.forEach((ip) => {
            const match = existingPositions.find((ep) => {
                return ep.companyId === ip.companyId
                && ep.startDateMonth === ip.startDateMonth
                && ep.startDateYear === ip.startDateYear;
            });

            if (match){
                if (ip.description && ip.description.length){
                    //eg. This will happend when a 'lite candidate' has their profile scraped
                    match.description = ip.description;
                }
            } else {
                result.push(ip);
            }
        });

        return result;
    }

    const _trimDownPositions = (positions) => {
        return positions ? positions.map((p) => {
            const mappedPosition = {
                startDateMonth: p.startDateMonth,
                startDateYear: p.startDateYear,
                companyId: p.companyId,
                companyName: p.companyName,
                displayText: p.displayText,
                title: p.title,
            };

            if (p.endDateMonth) {
                mappedPosition.endDateMonth = p.endDateMonth;
                mappedPosition.endDateYear = p.endDateYear;
            }

            if (p.description && p.description.length){
                mappedPosition.description = p.description;
            }

            return mappedPosition;
        }) : [];
    }

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        const fieldsNotToBeOverridden = ['positions', 'dateCreated', 'isJobSeeker', 'isJobSeekerString', 'isActivelyLooking', 'jobSeekerScrapedDate']
        let existingCandidate = await baseIndexDb.getObjectById(_objectStoreName, candidate.memberId);


        _updateJobSeekerScrapedDateAccordingly(existingCandidate, candidate);

        //Trim positions to minimal data for storage
        candidate.positions  = _trimDownPositions(candidate.positions);

        if (existingCandidate){
            for (let k in candidate){
                if (fieldsNotToBeOverridden.indexOf(k) === -1 && candidate[k]){
                    existingCandidate[k] = candidate[k];
                }
            }

            existingCandidate.positions = _mergePositions(existingCandidate.positions, candidate.positions);
            existingCandidate.isJobSeekerString = existingCandidate.isJobSeeker ? 'yes' : 'no'
            return await baseIndexDb.updateObject(_objectStoreName, existingCandidate, _keyPropertyName);
        }
        else {
            candidate.isJobSeekerString = candidate.isJobSeeker ? 'yes' : 'no';
            return await baseIndexDb.insertObject(_objectStoreName, candidate, _keyPropertyName);
        }

    }

    const _saveCandidates = async (candidatesArray) => {
        for(let i=0; i<candidatesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _saveCandidate(candidatesArray[i]);
        }
    }

    const _getCandidate = async (memberId) => {
        const lookFor = !isNaN(memberId) ? Number.parseInt(memberId) : null;

        if (lookFor){
            return await baseIndexDb.getObjectById(_objectStoreName, lookFor);
        }

        throw new Error(`${memberId} is not a valid memberId to search on`)
    }

    const _getEntireCandidateList = async() => {
        return await baseIndexDb.getAll(_objectStoreName);
    }

    const _getSpecificListOfLinkedInMembers = async(memberIdArray) => {
        return await baseIndexDb.getObjectsByListOfKeys(_objectStoreName, memberIdArray);
    }

    const _getCandidateList = async(memberIdArray = null) => {
        return memberIdArray ?
            await _getSpecificListOfLinkedInMembers(memberIdArray) :
            await _getEntireCandidateList();
    }

    const _loadLotsOfData = async (basedOnContact, fromId, toId) => {
        let counter = 0;
        let c = {...basedOnContact};

        for (let i=fromId; i<toId; i++) {
            c.memberId = i;
            counter+=1;

            // eslint-disable-next-line no-await-in-loop
            await baseIndexDb.insertObject(_objectStoreName, c, 'memberId');
            if (counter >= 100){
                console.log('saved another 100');
                counter = 0;
            }
        }
    }

    const _searchOnName = async (lastName, firstName = null) => {
        const results = await baseIndexDb.getObjectsByIndex(_objectStoreName, 'lastName', lastName);

        if (results && results.length){
            return firstName ? results.filter(c => c.firstName === firstName) : results;
        }

        return [];
    }

    const _searchForCandidate = async(searchFor) => {
        if (!isNaN(searchFor)){
            return await _getCandidate(searchFor);
        }

        const names = searchFor.split(' ');
        let found = null;

        if (names.length > 1){
            found = await _searchOnName(names[names.length-1], names[0]);

        }
        else {
            found = await _searchOnName(names[0]);
        }

        return found && found.length === 1 ? found[0] : null;
    }

    const _getJobSeekers = async () => {
        return await baseIndexDb.getObjectsByIndex(_objectStoreName, 'isJobSeekerString', 'yes');
    }

    const _whoGetsResetOnlyTonkaSourceFirstConnectionsCallbackFunction = (candidate) => {
        let result = false;

        if (candidate && candidate.alisonConnections){
            for(let k in candidate.alisonConnections){
                const connection = candidate.alisonConnections[k];
                if (connection === "1" || connection === 1){
                    result = true;
                    break;
                }
            }
        }

        return result;
    }

    const _resetJobSeekers = async (whoGetsResetCallbackFunction = _whoGetsResetOnlyTonkaSourceFirstConnectionsCallbackFunction) => {
        const candidates = await _getJobSeekers();
        for (let i=0; i<candidates.length; i++){
            const c = candidates[i];
            if (c.isJobSeeker && whoGetsResetCallbackFunction(c)){
                c.isJobSeeker = false;
                c.jobSeekerResetDate = (new Date()).getTime();

                // eslint-disable-next-line no-await-in-loop
                await baseIndexDb.updateObject(_objectStoreName, c, _keyPropertyName);
            }
        }
    }

    const _updateJobSeekerScrapedDateAccordingly = (existingCandidate, incomingCandidate) => {
        const icJobSeeker = (incomingCandidate.isJobSeeker || incomingCandidate.isActivelyLooking) || false;
        const ecJobSeeker = (existingCandidate && (existingCandidate.isJobSeeker || existingCandidate.isActivelyLooking)) || false;

        //isJobSeeker originates from the Recruiter Search Results page, only run this logic if the incomingCandidate
        //originated from that scraper.
        if (incomingCandidate.lastScrappedBy === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS){

            if (existingCandidate && ecJobSeeker !== icJobSeeker){
                existingCandidate.isJobSeeker = incomingCandidate.isJobSeeker || incomingCandidate.isActivelyLooking;

                let updateJobSeekerScrappedDate = true;

                //Check if the existing candidate just had it's 'isJobSeeker' reset as part of a daily job
                if (existingCandidate.jobSeekerResetDate){
                    const now = tsCommon.now();
                    const dayDiff = now.dayDiff(existingCandidate.jobSeekerResetDate);
                    if (dayDiff < 1) {
                        //the isJobSeeker flag was reset earlier today and is not getting set back
                        //don't update the jobSeekerScrappedDate, leave it as is.
                        updateJobSeekerScrappedDate = false;
                    }
                }

                if (updateJobSeekerScrappedDate){
                    existingCandidate.jobSeekerScrappedDate = (new Date()).getTime();
                }
            }

            //Check if saving a NEW candidate and they are a job seeker
            if ((!existingCandidate) && icJobSeeker){
                incomingCandidate.jobSeekerScrappedDate = (new Date()).getTime();
            }
        }
    }

    class CandidateRepository {
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _getCandidate;
        searchOnName = _searchOnName;
        searchForCandidate = _searchForCandidate;
        getJobSeekers = _getJobSeekers;

        resetJobSeekers = _resetJobSeekers;
        //loadLotsOfData = _loadLotsOfData;
    }

    window.candidateRepository = new CandidateRepository();
})();