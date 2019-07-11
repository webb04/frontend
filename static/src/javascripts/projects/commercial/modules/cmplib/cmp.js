// @flow
import {
    getAdConsentState,
    thirdPartyTrackingAdConsent,
} from 'common/modules/commercial/ad-prefs.lib';

export class ConsentManagementPlatform {
    funcStack = [];
    perfStack = [];
    adStack = [];

    addModules(newFuncStack, newPerfStack, newAdStack) {
        this.funcStack.concat(newFuncStack);
        this.perfStack.concat(newPerfStack);
        this.adStack.concat(newAdStack);
    }

    runModules() {
        const modulePromises = [];
        // The following is for testing purposes. Will eventually get individual consent states
        const consent = getAdConsentState(thirdPartyTrackingAdConsent);
        const funcConsent = consent;
        const perfConsent = consent;
        const adConsent = consent;

        if (funcConsent) {
            this.funcStack.forEach(module => {
                modulePromises.push(module());
            });
        }

        if (perfConsent) {
            this.perfStack.forEach(module => {
                modulePromises.push(module());
            });
        }

        if (adConsent) {
            this.adStack.forEach(module => {
                modulePromises.push(module());
            });
        }

        return modulePromises;
    }
}
