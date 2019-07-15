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
        this.essenStack.push(...newEssenStack);
        this.funcStack.push(...newFuncStack);
        this.perfStack.push(...newPerfStack);
        this.adStack.push(...newAdStack);
    }

    runModules() {
        const modulePromises = [];
        const funcConsent = ConsentManagementPlatform.functionalConsent();
        const perfConsent = ConsentManagementPlatform.performanceConsent();
        const adConsent = ConsentManagementPlatform.advertisementConsent();

        this.essenStack.forEach(module => {
            modulePromises.push(module());
        });

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

        // eslint-disable-next-line no-console
        console.log(
            `Ran ${modulePromises.length} modules out of ${this.essenStack
                .length +
                this.funcStack.length +
                this.perfStack.length +
                this.adStack.length} modules.`
        );

        this.essenStack = [];
        this.funcStack = [];
        this.perfStack = [];
        this.adStack = [];

        return Promise.all(modulePromises);
    }

    // The following is for testing purposes. Will eventually get individual consent states
    static functionalConsent() {
        return true;
    }

    static performanceConsent() {
        return true;
    }

    static advertisementConsent() {
        return getAdConsentState(thirdPartyTrackingAdConsent);
    }
}
