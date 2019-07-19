// @flow
import {
    getAdConsentState,
    thirdPartyTrackingAdConsent,
} from 'common/modules/commercial/ad-prefs.lib';

type CmpStackInfo = {
    fns: Array<() => Promise<any>>,
    hasConsent: boolean | null,
};

type CmpInternalStack = {
    essential: CmpStackInfo,
    functional: CmpStackInfo,
    performance: CmpStackInfo,
    advertisement: CmpStackInfo,
};

export type CmpStack = {
    essential?: Array<() => Promise<any>>,
    functional?: Array<() => Promise<any>>,
    performance?: Array<() => Promise<any>>,
    advertisement?: Array<() => Promise<any>>,
};

export class ConsentManagementPlatform {
    stack: CmpInternalStack = {
        essential: {
            fns: [],
            hasConsent: true,
        },
        functional: {
            fns: [],
            hasConsent: ConsentManagementPlatform.functionalConsent(),
        },
        performance: {
            fns: [],
            hasConsent: ConsentManagementPlatform.performanceConsent(),
        },
        advertisement: {
            fns: [],
            hasConsent: ConsentManagementPlatform.advertisementConsent(),
        },
    };

    addModules(newStack: CmpStack): ConsentManagementPlatform {
        Object.keys(newStack).forEach(key => {
            // Flow isn't happy unless we have this check
            if (newStack[key]) this.stack[key].fns.push(...newStack[key]);
        });

        return this;
    }

    runModules(): Promise<any> {
        const modulePromises = [];

        Object.keys(this.stack).forEach(key => {
            if (this.stack[key].hasConsent) {
                this.stack[key].fns.forEach(module => {
                    modulePromises.push(module());
                });
                this.stack[key].fns = [];
            }
        });

        return Promise.all(modulePromises);
    }

    // The following is for testing purposes. Will eventually get individual consent states
    static functionalConsent(): boolean | null {
        return true;
    }

    static performanceConsent(): boolean | null {
        return true;
    }

    static advertisementConsent(): boolean | null {
        return getAdConsentState(thirdPartyTrackingAdConsent);
    }
}
