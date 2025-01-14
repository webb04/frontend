// @flow
import { local } from 'lib/storage';

import { commercialFeatures } from 'common/modules/commercial/commercial-features';
import {
    getPageTargeting,
    _,
} from 'common/modules/commercial/build-page-targeting';
import config from 'lib/config';
import { getCookie as getCookie_ } from 'lib/cookies';
import {
    getReferrer as getReferrer_,
    getBreakpoint as getBreakpoint_,
} from 'lib/detect';
import { getSync as getSync_ } from 'lib/geolocation';
import { isUserLoggedIn as isUserLoggedIn_ } from 'common/modules/identity/api';
import { getUserSegments as getUserSegments_ } from 'common/modules/commercial/user-ad-targeting';
import { getSynchronousParticipations as getSynchronousParticipations_ } from 'common/modules/experiments/ab';
import { getKruxSegments as getKruxSegments_ } from 'common/modules/commercial/krux';
import { onIabConsentNotification as onIabConsentNotification_ } from '@guardian/consent-management-platform';

const getCookie: any = getCookie_;
const getUserSegments: any = getUserSegments_;
const getSynchronousParticipations: any = getSynchronousParticipations_;
const getKruxSegments: any = getKruxSegments_;
const getReferrer: any = getReferrer_;
const getBreakpoint: any = getBreakpoint_;
const isUserLoggedIn: any = isUserLoggedIn_;
const getSync: any = getSync_;
const onIabConsentNotification: any = onIabConsentNotification_;

jest.mock('lib/storage');
jest.mock('lib/config');
jest.mock('lib/cookies', () => ({
    getCookie: jest.fn(),
}));
jest.mock('lib/detect', () => ({
    getViewport: jest.fn(),
    getBreakpoint: jest.fn(),
    getReferrer: jest.fn(),
    hasPushStateSupport: jest.fn(),
}));
jest.mock('lib/geolocation', () => ({
    getSync: jest.fn(),
}));
jest.mock('common/modules/identity/api', () => ({
    isUserLoggedIn: jest.fn(),
}));
jest.mock('common/modules/commercial/user-ad-targeting', () => ({
    getUserSegments: jest.fn(),
}));
jest.mock('common/modules/experiments/ab', () => ({
    getSynchronousParticipations: jest.fn(),
}));
jest.mock('common/modules/commercial/krux', () => ({
    getKruxSegments: jest.fn(),
}));
jest.mock('lodash/once', () => fn => fn);
jest.mock('common/modules/commercial/commercial-features', () => ({
    commercialFeatures() {},
}));
jest.mock('@guardian/consent-management-platform', () => ({
    onIabConsentNotification: jest.fn(),
}));

const trueConsentMock = (callback): void =>
    callback({ '1': true, '2': true, '3': true, '4': true, '5': true });
const falseConsentMock = (callback): void =>
    callback({ '1': false, '2': false, '3': false, '4': false, '5': false });
const nullConsentMock = (callback): void =>
    callback({ '1': null, '2': null, '3': null, '4': null, '5': null });
const mixedConsentMock = (callback): void =>
    callback({ '1': false, '2': true, '3': true, '4': false, '5': true });

describe('Build Page Targeting', () => {
    beforeEach(() => {
        config.page = {
            authorIds: 'profile/gabrielle-chan',
            blogIds: 'a/blog',
            contentType: 'Video',
            edition: 'US',
            keywordIds:
                'uk-news/prince-charles-letters,uk/uk,uk/prince-charles',
            pageId: 'football/series/footballweekly',
            publication: 'The Observer',
            seriesId: 'film/series/filmweekly',
            source: 'ITN',
            sponsorshipType: 'advertisement-features',
            tones: 'News',
            videoDuration: 63,
            sharedAdTargeting: {
                bl: ['blog'],
                br: 'p',
                co: ['gabrielle-chan'],
                ct: 'video',
                edition: 'us',
                k: ['prince-charles-letters', 'uk/uk', 'prince-charles'],
                ob: 't',
                p: 'ng',
                se: ['filmweekly'],
                su: ['5'],
                tn: ['news'],
                url: '/football/series/footballweekly',
            },
            isSensitive: false,
        };
        config.ophan = { pageViewId: 'presetOphanPageViewId' };

        commercialFeatures.adFree = false;

        // Reset mocking to default values.
        getCookie.mockReturnValue('ng101');
        _.resetPageTargeting();
        onIabConsentNotification.mockImplementation(nullConsentMock);

        getBreakpoint.mockReturnValue('mobile');
        getReferrer.mockReturnValue('');

        isUserLoggedIn.mockReturnValue(true);

        getUserSegments.mockReturnValue(['seg1', 'seg2']);

        getSynchronousParticipations.mockReturnValue({
            MtMaster: {
                variant: 'variantName',
            },
        });
        getKruxSegments.mockReturnValue(['E012712', 'E012390', 'E012478']);

        local.set('gu.alreadyVisited', 0);

        getSync.mockReturnValue('US');

        expect.hasAssertions();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should exist', () => {
        expect(getPageTargeting).toBeDefined();
    });

    it('should build correct page targeting', () => {
        const pageTargeting = getPageTargeting();

        expect(pageTargeting.sens).toBe('f');
        expect(pageTargeting.edition).toBe('us');
        expect(pageTargeting.ct).toBe('video');
        expect(pageTargeting.p).toBe('ng');
        expect(pageTargeting.su).toEqual(['5']);
        expect(pageTargeting.bp).toBe('mobile');
        expect(pageTargeting.at).toBe('ng101');
        expect(pageTargeting.si).toEqual('t');
        expect(pageTargeting.gdncrm).toEqual(['seg1', 'seg2']);
        expect(pageTargeting.co).toEqual(['gabrielle-chan']);
        expect(pageTargeting.bl).toEqual(['blog']);
        expect(pageTargeting.ms).toBe('itn');
        expect(pageTargeting.tn).toEqual(['news']);
        expect(pageTargeting.vl).toEqual('90');
        expect(pageTargeting.pv).toEqual('presetOphanPageViewId');
        expect(pageTargeting.pa).toEqual('f');
        expect(pageTargeting.cc).toEqual('US');
        expect(pageTargeting.rp).toEqual('dotcom-platform');
    });

    it('should set correct personalized ad (pa) param', () => {
        onIabConsentNotification.mockImplementation(trueConsentMock);
        expect(getPageTargeting().pa).toBe('t');

        _.resetPageTargeting();
        onIabConsentNotification.mockImplementation(falseConsentMock);
        expect(getPageTargeting().pa).toBe('f');

        _.resetPageTargeting();
        onIabConsentNotification.mockImplementation(nullConsentMock);
        expect(getPageTargeting().pa).toBe('f');

        _.resetPageTargeting();
        onIabConsentNotification.mockImplementation(mixedConsentMock);
        expect(getPageTargeting().pa).toBe('f');
    });

    it('should set correct edition param', () => {
        expect(getPageTargeting().edition).toBe('us');
    });

    it('should set correct se param', () => {
        expect(getPageTargeting().se).toEqual(['filmweekly']);
    });

    it('should set correct k param', () => {
        expect(getPageTargeting().k).toEqual([
            'prince-charles-letters',
            'uk/uk',
            'prince-charles',
        ]);
    });

    it('should set correct ab param', () => {
        expect(getPageTargeting().ab).toEqual(['MtMaster-variantName']);
    });

    it('should set correct krux params', () => {
        expect(getPageTargeting().x).toEqual(['E012712', 'E012390', 'E012478']);
    });

    it('should set Observer flag for Observer content', () => {
        expect(getPageTargeting().ob).toEqual('t');
    });

    it('should set correct branding param for paid content', () => {
        expect(getPageTargeting().br).toEqual('p');
    });

    it('should not contain an ad-free targeting value', () => {
        expect(getPageTargeting().af).toBeUndefined();
    });

    it('should remove empty values', () => {
        config.page = {};
        config.ophan = { pageViewId: '123456' };
        getUserSegments.mockReturnValue([]);
        getKruxSegments.mockReturnValue([]);

        expect(getPageTargeting()).toEqual({
            sens: 'f',
            bp: 'mobile',
            at: 'ng101',
            si: 't',
            ab: ['MtMaster-variantName'],
            pv: '123456',
            fr: '0',
            inskin: 'f',
            pa: 'f',
            cc: 'US',
            rp: 'dotcom-platform',
        });
    });

    describe('Breakpoint targeting', () => {
        it('should set correct breakpoint targeting for a mobile device', () => {
            getBreakpoint.mockReturnValue('mobile');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a medium mobile device', () => {
            getBreakpoint.mockReturnValue('mobileMedium');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a mobile device in landscape mode', () => {
            getBreakpoint.mockReturnValue('mobileLandscape');
            expect(getPageTargeting().bp).toEqual('mobile');
        });

        it('should set correct breakpoint targeting for a phablet device', () => {
            getBreakpoint.mockReturnValue('phablet');
            expect(getPageTargeting().bp).toEqual('tablet');
        });

        it('should set correct breakpoint targeting for a tablet device', () => {
            getBreakpoint.mockReturnValue('tablet');
            expect(getPageTargeting().bp).toEqual('tablet');
        });

        it('should set correct breakpoint targeting for a desktop device', () => {
            getBreakpoint.mockReturnValue('desktop');
            expect(getPageTargeting().bp).toEqual('desktop');
        });

        it('should set correct breakpoint targeting for a leftCol device', () => {
            getBreakpoint.mockReturnValue('leftCol');
            expect(getPageTargeting().bp).toEqual('desktop');
        });

        it('should set correct breakpoint targeting for a wide device', () => {
            getBreakpoint.mockReturnValue('wide');
            expect(getPageTargeting().bp).toEqual('desktop');
        });
    });

    describe('Build Page Targeting (ad-free)', () => {
        it('should set the ad-free param to t when enabled', () => {
            commercialFeatures.adFree = true;
            expect(getPageTargeting().af).toBe('t');
        });
    });

    describe('Already visited frequency', () => {
        it('can pass a value of five or less', () => {
            local.set('gu.alreadyVisited', 5);
            expect(getPageTargeting().fr).toEqual('5');
        });

        it('between five and thirty, includes it in a bucket in the form "x-y"', () => {
            local.set('gu.alreadyVisited', 18);
            expect(getPageTargeting().fr).toEqual('16-19');
        });

        it('over thirty, includes it in the bucket "30plus"', () => {
            local.set('gu.alreadyVisited', 300);
            expect(getPageTargeting().fr).toEqual('30plus');
        });

        it('passes a value of 0 if the value is not stored', () => {
            local.remove('gu.alreadyVisited');
            expect(getPageTargeting().fr).toEqual('0');
        });
    });

    describe('Referrer', () => {
        it('should set ref to Facebook', () => {
            getReferrer.mockReturnValue(
                'https://www.facebook.com/feel-the-force'
            );
            expect(getPageTargeting().ref).toEqual('facebook');
        });

        it('should set ref to Twitter', () => {
            getReferrer.mockReturnValue(
                'https://www.t.co/you-must-unlearn-what-you-have-learned'
            );
            expect(getPageTargeting().ref).toEqual('twitter');
        });

        it('should set ref to reddit', () => {
            getReferrer.mockReturnValue(
                'https://www.reddit.com/its-not-my-fault'
            );
            expect(getPageTargeting().ref).toEqual('reddit');
        });

        it('should set ref to google', () => {
            getReferrer.mockReturnValue(
                'https://www.google.com/i-find-your-lack-of-faith-distrubing'
            );
            expect(getPageTargeting().ref).toEqual('google');
        });

        it('should set ref empty string if referrer does not match', () => {
            getReferrer.mockReturnValue('https://theguardian.com');
            expect(getPageTargeting().ref).toEqual(undefined);
        });
    });
});
