// @flow
import {
    getAdConsentState,
    thirdPartyTrackingAdConsent,
} from 'common/modules/commercial/ad-prefs.lib';

export class ConsentManagementPlatform {
    essenStack = [];
    funcStack = [];
    perfStack = [];
    adStack = [];

    addModules(
        newEssenStack: Array<Function>,
        newFuncStack: Array<Function>,
        newPerfStack: Array<Function>,
        newAdStack: Array<Function>
    ): void {
        this.essenStack.concat(newEssenStack);
        this.funcStack.concat(newFuncStack);
        this.perfStack.concat(newPerfStack);
        this.adStack.concat(newAdStack);
    }

    runModules() {
        const modulePromises = [];
        const funcConsent = ConsentManagementPlatform.functionalConsent();
        const perfConsent = ConsentManagementPlatform.performanceConsent();
        const adConsent = ConsentManagementPlatform.advertisementConsent();

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

        return modulePromises; // Return instead a single promise wrapping all the module promises?
    }

    // The following is for testing purposes. Will eventually get individual consent states
    static functionalConsent() {
        return getAdConsentState(thirdPartyTrackingAdConsent);
    }

    static performanceConsent() {
        return getAdConsentState(thirdPartyTrackingAdConsent);
    }

    static advertisementConsent() {
        return getAdConsentState(thirdPartyTrackingAdConsent);
    }
}
