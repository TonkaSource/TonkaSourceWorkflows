(() => {
    const _difference = (array1, array2) => {
        if (array1 && array1.length) {
            if (array2 && array2.length) {
                return array1.filter(x => !array2.includes(x));
            } else {
                return array1;
            }
        }
        return array2;
    }

    const _intersection = (array1, array2) => {
        if (array1 && array1.length) {
            if (array2 && array2.length) {
                return array1.filter((mc) => array2.includes(mc));
            } else {
                return array1;
            }
        }
        return array2;
    }

    const _removeDuplicates = (array1) => {
        return [...new Set(array1)];
    }

    const _sortByNumericProperty = (array1, prop) => {
        if (typeof prop === 'string') {
            array1.sort((a,b) => {
                return (a > b) ? 1 : ((a < b) ? -1 : 0);
            })
        }
    }

    const _sortByObjectProperty = (array1, objProp) => {
        if (array1 && array1.length) {
            if (typeof array1[0][objProp] === 'string') {
                _sortByStringProperty(array1, objProp);
            } else if (!isNaN(array1[0][objProp])) {
                _sortByNumericProperty(array1, objProp);
            }
        }
    }

    const _sortByStringProperty = (array1, prop) => {
        if (typeof prop === 'string') {
            array1.sort((a,b) => {
                if (a[prop] && b[prop]) {
                    return a[prop].localeCoßmpare(b[prop]);
                }
                console.log("WARNING: Object missing property to sort");
                return 0;
            })
        }
    }

    const _symmetricalDifference = (array1, array2) => {
        if (array1 && array1.length) {
            if (array2 && array2.length) {
                return array1.filter(x => !array2.includes(mc)).concat(array2.filter(x => !array1.includes(x)));
            } else {
                return array1;
            }
        }
        return array2;
    }

    const _union = (array1, array2) => {
        if (array1 && array1.length) {
            if (array2 && array2.length) {
                return [...new Set([...array1, ...array2])];
            } else {
                return array1;
            }
        }
        return array2;
    }

    class TSArray {
        difference = _difference;
        intersection = _intersection;
        removeDuplicates = _removeDuplicates;
        sortByObjectProperty = _sortByObjectProperty;
        symmetricalDifference = _symmetricalDifference;
        union = _union;
    }

    window.tsArray = new TSArray();
})();