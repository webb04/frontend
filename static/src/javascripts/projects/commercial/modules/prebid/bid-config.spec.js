// @flow
/* global jsdom */

import config from 'lib/config';
import { isInVariantSynchronous as isInVariantSynchronous_ } from 'common/modules/experiments/ab';
import { _, bids } from './bid-config';
import type { PrebidBidder, PrebidSize } from './types';
import {
    containsBillboard as containsBillboard_,
    containsDmpu as containsDmpu_,
    containsLeaderboard as containsLeaderboard_,
    containsLeaderboardOrBillboard as containsLeaderboardOrBillboard_,
    containsMobileSticky as containsMobileSticky_,
    containsMpu as containsMpu_,
    containsMpuOrDmpu as containsMpuOrDmpu_,
    getBreakpointKey as getBreakpointKey_,
    isInAuRegion as isInAuRegion_,
    isInRowRegion as isInRowRegion_,
    isInUkRegion as isInUkRegion_,
    isInUsRegion as isInUsRegion_,
    shouldIncludeAdYouLike as shouldIncludeAdYouLike_,
    shouldIncludeAppNexus as shouldIncludeAppNexus_,
    shouldIncludeImproveDigital as shouldIncludeImproveDigital_,
    shouldIncludeOpenx as shouldIncludeOpenx_,
    shouldIncludeOzone as shouldIncludeOzone_,
    shouldIncludeTrustX as shouldIncludeTrustX_,
    shouldIncludeXaxis as shouldIncludeXaxis_,
    shouldIncludeSonobi as shouldIncludeSonobi_,
    stripMobileSuffix as stripMobileSuffix_,
    shouldIncludeTripleLift as shouldIncludeTripleLift_,
} from './utils';

const containsBillboard: any = containsBillboard_;
const containsDmpu: any = containsDmpu_;
const containsLeaderboard: any = containsLeaderboard_;
const containsLeaderboardOrBillboard: any = containsLeaderboardOrBillboard_;
const containsMobileSticky: any = containsMobileSticky_;
const containsMpu: any = containsMpu_;
const containsMpuOrDmpu: any = containsMpuOrDmpu_;
const shouldIncludeAdYouLike: any = shouldIncludeAdYouLike_;
const shouldIncludeAppNexus: any = shouldIncludeAppNexus_;
const shouldIncludeImproveDigital: any = shouldIncludeImproveDigital_;
const shouldIncludeOpenx: any = shouldIncludeOpenx_;
const shouldIncludeOzone: any = shouldIncludeOzone_;
const shouldIncludeTrustX: any = shouldIncludeTrustX_;
const shouldIncludeXaxis: any = shouldIncludeXaxis_;
const shouldIncludeSonobi: any = shouldIncludeSonobi_;
const shouldIncludeTripleLift: any = shouldIncludeTripleLift_;
const stripMobileSuffix: any = stripMobileSuffix_;
const getBreakpointKey: any = getBreakpointKey_;
const isInAuRegion: any = isInAuRegion_;
const isInRowRegion: any = isInRowRegion_;
const isInUkRegion: any = isInUkRegion_;
const isInUsRegion: any = isInUsRegion_;
const isInVariantSynchronous: any = isInVariantSynchronous_;

const getBidders = () =>
    bids('dfp-ad--top-above-nav', [[728, 90]]).map(bid => bid.bidder);

const {
    getDummyServerSideBidders,
    getIndexSiteId,
    getImprovePlacementId,
    getTrustXAdUnitId,
    indexExchangeBidders,
} = _;

jest.mock('common/modules/commercial/build-page-targeting', () => ({
    buildAppNexusTargeting: () => 'someTestAppNexusTargeting',
    buildAppNexusTargetingObject: () => 'someAppNexusTargetingObject',
    getPageTargeting: () => 'bla',
}));

jest.mock('common/modules/commercial/ad-prefs.lib', () => ({
    getAdConsentState: jest.fn(),
}));

jest.mock('./utils');

jest.mock('common/modules/experiments/ab', () => ({
    isInVariantSynchronous: jest.fn(),
}));

jest.mock('lib/cookies', () => ({
    getCookie: jest.fn(),
}));

/* eslint-disable guardian-frontend/no-direct-access-config */
const resetConfig = () => {
    config.set('switches.prebidAppnexus', true);
    config.set('switches.prebidAppnexusInvcode', false);
    config.set('switches.prebidOpenx', true);
    config.set('switches.prebidImproveDigital', true);
    config.set('switches.prebidIndexExchange', true);
    config.set('switches.prebidSonobi', true);
    config.set('switches.prebidTrustx', true);
    config.set('switches.prebidXaxis', true);
    config.set('switches.prebidAdYouLike', true);
    config.set('switches.prebidS2sozone', true);
    config.set('switches.prebidPangaea', true);
    config.set('switches.prebidTriplelift', true);
    config.set('ophan', { pageViewId: 'pvid' });
    config.set('page.contentType', 'Article');
    config.set('page.section', 'Magic');
    config.set('page.isDev', false);
};

describe('getDummyServerSideBidders', () => {
    beforeEach(() => {
        resetConfig();
        window.OzoneLotameData = { some: 'lotamedata' };
    });

    afterEach(() => {
        jest.resetAllMocks();
        window.OzoneLotameData = undefined;
    });

    test('should return an empty array if the switch is off', () => {
        config.set('switches.prebidS2sozone', false);
        expect(getDummyServerSideBidders()).toEqual([]);
    });

    test('should return an empty array if outside the test sample', () => {
        expect(getDummyServerSideBidders()).toEqual([]);
    });

    test('should otherwise return the expected array of bidders', () => {
        shouldIncludeOzone.mockReturnValueOnce(true);
        const bidderNames = getDummyServerSideBidders().map(
            bidder => bidder.name
        );
        expect(bidderNames).toEqual(['openx', 'appnexus', 'pangaea']);
    });

    test('should include methods in the response that generate the correct bid params', () => {
        shouldIncludeOzone.mockReturnValueOnce(true);
        const bidders: Array<PrebidBidder> = getDummyServerSideBidders();
        const openxParams = bidders[0].bidParams('type', [[1, 2]]);
        const appNexusParams = bidders[1].bidParams('type', [[1, 2]]);
        expect(openxParams).toEqual({
            delDomain: 'guardian-d.openx.net',
            unit: '539997090',
            lotame: { some: 'lotamedata' },
            customParams: 'someAppNexusTargetingObject',
        });
        expect(appNexusParams).toEqual({
            placementId: '13915593',
            keywords: 'someAppNexusTargetingObject',
            lotame: { some: 'lotamedata' },
        });
    });
});

describe('getImprovePlacementId', () => {
    beforeEach(() => {
        resetConfig();
        getBreakpointKey.mockReturnValue('D');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    const generateTestIds = (): Array<number> => {
        const prebidSizes: Array<Array<PrebidSize>> = [
            [[300, 250]],
            [[300, 600]],
            [[970, 250]],
            [[728, 90]],
            [[1, 2]],
        ];
        return prebidSizes.map(getImprovePlacementId);
    };

    test('should return -1 if no cases match', () => {
        expect(getImprovePlacementId([[1, 2]])).toBe(-1);
    });

    test('should return the expected values when geolocated in UK and on desktop device', () => {
        isInUkRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('D');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        expect(generateTestIds()).toEqual([
            1116396,
            1116396,
            1116397,
            1116397,
            -1,
        ]);
    });

    test('should return the expected values when geolocated in UK and on tablet device', () => {
        isInUkRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('T');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        expect(generateTestIds()).toEqual([
            1116398,
            1116398,
            1116399,
            1116399,
            -1,
        ]);
    });

    test('should return the expected values when geolocated in UK and on mobile device', () => {
        isInUkRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('M');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        expect(generateTestIds()).toEqual([1116400, 1116400, -1, -1, -1]);
    });

    test('should return the expected values when geolocated in ROW region and on desktop device', () => {
        isInRowRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('D');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        expect(generateTestIds()).toEqual([
            1116420,
            1116420,
            1116421,
            1116421,
            -1,
        ]);
    });

    test('should return the expected values when not geolocated in ROW region and on tablet device', () => {
        isInRowRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('T');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValueOnce(true);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        expect(generateTestIds()).toEqual([
            1116422,
            1116422,
            1116423,
            1116423,
            -1,
        ]);
    });

    test('should return the expected values when geolocated in ROW region and on mobile device', () => {
        isInRowRegion.mockReturnValue(true);
        getBreakpointKey.mockReturnValue('M');
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValueOnce(true);
        containsMpuOrDmpu.mockReturnValue(false);
        expect(generateTestIds()).toEqual([1116424, 1116424, -1, -1, -1]);
    });

    test('should return -1 if geolocated in US or AU regions', () => {
        isInUsRegion.mockReturnValue(true);
        expect(generateTestIds()).toEqual([-1, -1, -1, -1, -1]);
        isInAuRegion.mockReturnValue(true);
        expect(generateTestIds()).toEqual([-1, -1, -1, -1, -1]);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in desktop MPU', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('D');
        containsMpu.mockReturnValue(true);
        expect(getImprovePlacementId([[300, 250]])).toEqual(1116407);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in desktop DMPU', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('D');
        containsDmpu.mockReturnValue(true);
        expect(getImprovePlacementId([[300, 600]])).toEqual(1116408);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in desktop billboard', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('D');
        containsLeaderboardOrBillboard.mockReturnValue(true);
        expect(getImprovePlacementId([[970, 250]])).toEqual(1116409);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in desktop leaderboard', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('D');
        containsLeaderboardOrBillboard.mockReturnValue(true);
        expect(getImprovePlacementId([[728, 90]])).toEqual(1116409);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in tablet MPU', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('T');
        containsMpu.mockReturnValue(true);
        expect(getImprovePlacementId([[300, 250]])).toEqual(1116410);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in tablet leaderboard', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('T');
        containsLeaderboard.mockReturnValue(true);
        expect(getImprovePlacementId([[728, 90]])).toEqual(1116411);
    });

    test('should use test placement ID when participating in CommercialPrebidSafeframe test in mobile MPU', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('M');
        expect(getImprovePlacementId([[300, 250]])).toEqual(1116412);
    });
});

describe('getTrustXAdUnitId', () => {
    beforeEach(() => {
        getBreakpointKey.mockReturnValue('D');
        stripMobileSuffix.mockImplementation(str => str);
    });

    afterEach(() => {
        jest.resetAllMocks();
        resetConfig();
    });

    test('should return the expected value for dfp-ad--comments', () => {
        expect(getTrustXAdUnitId('dfp-ad--comments', true)).toBe('3840');
    });

    test('should return the expected values for dfp-ad--inline10', () => {
        expect(getTrustXAdUnitId('dfp-ad--inline10', true)).toBe('3840');
        expect(getTrustXAdUnitId('dfp-ad--inline10', false)).toBe('3841');
    });

    test('should return the expected values for dfp-ad--mobile-sticky', () => {
        expect(getTrustXAdUnitId('dfp-ad--mobile-sticky', true)).toBe('8519');
    });
});

describe('indexExchangeBidders', () => {
    beforeEach(() => {
        resetConfig();
        getBreakpointKey.mockReturnValue('D');
        config.set('page.pbIndexSites', [
            { bp: 'D', id: 123456 },
            { bp: 'M', id: 234567 },
            { bp: 'T', id: 345678 },
        ]);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should return an IX bidder for every size that the slot can take', () => {
        const slotSizes: Array<PrebidSize> = [[300, 250], [300, 600]];
        const bidders: Array<PrebidBidder> = indexExchangeBidders(slotSizes);
        expect(bidders).toEqual([
            expect.objectContaining({
                name: 'ix',
                bidParams: expect.any(Function),
            }),
            expect.objectContaining({
                name: 'ix',
                bidParams: expect.any(Function),
            }),
        ]);
    });

    test('should include methods in the response that generate the correct bid params', () => {
        const slotSizes: Array<PrebidSize> = [[300, 250], [300, 600]];
        const bidders: Array<PrebidBidder> = indexExchangeBidders(slotSizes);
        expect(bidders[0].bidParams('type', [[1, 2]])).toEqual({
            siteId: '123456',
            size: [300, 250],
        });
        expect(bidders[1].bidParams('type', [[1, 2]])).toEqual({
            siteId: '123456',
            size: [300, 600],
        });
    });
});

describe('getIndexSiteId', () => {
    afterEach(() => {
        jest.resetAllMocks();
        resetConfig();
    });

    test('should return an empty string if pbIndexSites is empty', () => {
        config.set('page.pbIndexSites', []);
        getBreakpointKey.mockReturnValue('D');
        expect(getIndexSiteId()).toBe('');
        expect(getIndexSiteId().length).toBe(0);
    });

    test('should find the correct ID for the breakpoint', () => {
        config.set('page.pbIndexSites', [
            { bp: 'D', id: 123456 },
            { bp: 'M', id: 234567 },
            { bp: 'T', id: 345678 },
        ]);
        const breakpoints = ['M', 'D', 'M', 'T', 'D'];
        const results = [];
        for (let i = 0; i < breakpoints.length; i += 1) {
            getBreakpointKey.mockReturnValue(breakpoints[i]);
            results.push(getIndexSiteId());
        }
        expect(results).toEqual([
            '234567',
            '123456',
            '234567',
            '345678',
            '123456',
        ]);
    });

    test('should use test site ID when participating in CommercialPrebidSafeframe test on desktop', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('D');
        expect(getIndexSiteId()).toEqual('287246');
    });

    test('should use test site ID when participating in CommercialPrebidSafeframe test on tablet', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('T');
        expect(getIndexSiteId()).toEqual('287247');
    });

    test('should use test site ID when participating in CommercialPrebidSafeframe test on mobile', () => {
        isInVariantSynchronous.mockImplementationOnce(
            (testId, variantId) => variantId === 'variant'
        );
        getBreakpointKey.mockReturnValue('M');
        expect(getIndexSiteId()).toEqual('287248');
    });
});

describe('bids', () => {
    beforeEach(() => {
        resetConfig();
        containsBillboard.mockReturnValue(false);
        containsDmpu.mockReturnValue(false);
        containsLeaderboard.mockReturnValue(false);
        containsLeaderboardOrBillboard.mockReturnValue(false);
        containsMpu.mockReturnValue(false);
        containsMpuOrDmpu.mockReturnValue(false);
        shouldIncludeAdYouLike.mockReturnValue(true);
        shouldIncludeAppNexus.mockReturnValue(false);
        shouldIncludeTrustX.mockReturnValue(false);
        stripMobileSuffix.mockImplementation(str => str);
    });

    afterEach(() => {
        jest.resetAllMocks();
        jsdom.reconfigure({
            url: 'https://some.domain/path',
        });
    });

    const setQueryString = (s: string) => {
        jsdom.reconfigure({
            url: `https://some.domain/path?${s}`,
        });
    };

    test('should only include bidders that are switched on if no bidders being tested', () => {
        config.set('switches.prebidXaxis', false);
        shouldIncludeOzone.mockReturnValueOnce(true);
        shouldIncludeImproveDigital.mockReturnValueOnce(true);
        expect(getBidders()).toEqual([
            'ix',
            'improvedigital',
            'adyoulike',
            'openx',
            'appnexus',
            'pangaea',
        ]);
    });

    test('should not include ix bidders when switched off', () => {
        config.set('switches.prebidIndexExchange', false);
        expect(getBidders()).toEqual(['adyoulike']);
    });

    test('should include Sonobi if in target geolocation', () => {
        shouldIncludeSonobi.mockReturnValue(true);
        expect(getBidders()).toEqual(['ix', 'sonobi', 'adyoulike']);
    });

    test('should include AppNexus directly if in target geolocation', () => {
        shouldIncludeAppNexus.mockReturnValue(true);
        expect(getBidders()).toEqual(['ix', 'and', 'adyoulike']);
    });

    test('should include OpenX directly if in target geolocation', () => {
        shouldIncludeOpenx.mockReturnValue(true);
        expect(getBidders()).toEqual(['ix', 'adyoulike', 'oxd']);
    });

    test('should include TrustX if in target geolocation', () => {
        shouldIncludeTrustX.mockReturnValue(true);
        expect(getBidders()).toEqual(['ix', 'trustx', 'adyoulike']);
    });

    test('should include ix bidder for each size that slot can take', () => {
        const rightSlotBidders = () =>
            bids('dfp-right', [[300, 600], [300, 250]]).map(bid => bid.bidder);
        expect(rightSlotBidders()).toEqual(['ix', 'ix', 'adyoulike']);
    });

    test('should only include bidder being tested', () => {
        setQueryString('pbtest=xhb');
        expect(getBidders()).toEqual(['xhb']);
    });

    test('should only include bidder being tested, even when its switch is off', () => {
        setQueryString('pbtest=xhb');
        config.set('switches.prebidXaxis', false);
        expect(getBidders()).toEqual(['xhb']);
    });

    test('should only include bidder being tested, even when it should not be included', () => {
        setQueryString('pbtest=xhb');
        shouldIncludeXaxis.mockReturnValue(false);
        expect(getBidders()).toEqual(['xhb']);
    });

    test('should only include multiple bidders being tested, even when their switches are off', () => {
        setQueryString('pbtest=xhb&pbtest=sonobi');
        isInVariantSynchronous.mockImplementation(
            (testId, variantId) => variantId === 'variant'
        );
        config.set('switches.prebidXaxis', false);
        config.set('switches.prebidSonobi', false);
        expect(getBidders()).toEqual(['xhb', 'sonobi']);
    });

    test('should ignore bidder that does not exist', () => {
        setQueryString('pbtest=nonexistentbidder&pbtest=xhb');
        expect(getBidders()).toEqual(['xhb']);
    });

    test('should use correct parameters in OpenX bids geolocated in UK', () => {
        shouldIncludeOpenx.mockReturnValue(true);
        isInUkRegion.mockReturnValue(true);
        const openXBid = bids('dfp-ad--top-above-nav', [[728, 90]])[2];
        expect(openXBid.params).toEqual({
            customParams: 'someAppNexusTargetingObject',
            delDomain: 'guardian-d.openx.net',
            unit: '540279541',
        });
    });

    test('should use correct parameters in OpenX bids geolocated in US', () => {
        shouldIncludeOpenx.mockReturnValue(true);
        isInUsRegion.mockReturnValue(true);
        const openXBid = bids('dfp-ad--top-above-nav', [[728, 90]])[2];
        expect(openXBid.params).toEqual({
            customParams: 'someAppNexusTargetingObject',
            delDomain: 'guardian-us-d.openx.net',
            unit: '540279544',
        });
    });

    test('should use correct parameters in OpenX bids geolocated in AU', () => {
        shouldIncludeOpenx.mockReturnValue(true);
        isInAuRegion.mockReturnValue(true);
        const openXBid = bids('dfp-ad--top-above-nav', [[728, 90]])[2];
        expect(openXBid.params).toEqual({
            customParams: 'someAppNexusTargetingObject',
            delDomain: 'guardian-aus-d.openx.net',
            unit: '540279542',
        });
    });

    test('should use correct parameters in OpenX bids geolocated in FR', () => {
        shouldIncludeOpenx.mockReturnValue(true);
        isInRowRegion.mockReturnValue(true);
        const openXBid = bids('dfp-ad--top-above-nav', [[728, 90]])[2];
        expect(openXBid.params).toEqual({
            customParams: 'someAppNexusTargetingObject',
            delDomain: 'guardian-d.openx.net',
            unit: '540279541',
        });
    });

    test('should not include Pangaea when switched off', () => {
        config.set('switches.prebidPangaea', false);
        shouldIncludeOzone.mockReturnValue(true);
        expect(getBidders()).toEqual(['ix', 'adyoulike', 'openx', 'appnexus']);
    });
});

describe('triplelift adapter', () => {
    beforeEach(() => {
        resetConfig();
        config.set('page.contentType', 'Article');
        shouldIncludeTripleLift.mockReturnValue(true);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should include triplelift adapter if condition is true ', () => {
        expect(getBidders()).toEqual(['ix', 'triplelift']);
    });

    test('should return correct triplelift adapter params for leaderboard', () => {
        containsLeaderboard.mockReturnValueOnce(true);
        containsMpu.mockReturnValueOnce(false);
        containsDmpu.mockReturnValueOnce(false);
        containsMobileSticky.mockReturnValueOnce(false);

        const tripleLiftBids = bids('dfp-ad--top-above-nav', [[728, 90]])[1]
            .params;
        expect(tripleLiftBids).toEqual({
            inventoryCode: 'theguardian_topbanner_728x90_prebid',
        });
    });

    test('should return correct triplelift adapter params for mbu', () => {
        containsLeaderboard.mockReturnValueOnce(false);
        containsMpu.mockReturnValueOnce(true);
        containsDmpu.mockReturnValueOnce(false);
        containsMobileSticky.mockReturnValueOnce(false);

        const tripleLiftBids = bids('dfp-ad--inline1', [[300, 250]])[1].params;
        expect(tripleLiftBids).toEqual({
            inventoryCode: 'theguardian_sectionfront_300x250_prebid',
        });
    });

    test('should return correct triplelift adapter params for mobile sticky', () => {
        containsLeaderboard.mockReturnValueOnce(false);
        containsMpu.mockReturnValueOnce(false);
        containsDmpu.mockReturnValueOnce(false);
        containsMobileSticky.mockReturnValueOnce(true);

        const tripleLiftBids = bids('dfp-ad--top-above-nav', [[320, 50]])[1]
            .params;
        expect(tripleLiftBids).toEqual({
            inventoryCode: 'theguardian_320x50_HDX',
        });
    });
});

describe('xaxis adapter', () => {
    beforeEach(() => {
        resetConfig();
        config.set('page.contentType', 'Article');
        shouldIncludeXaxis.mockReturnValue(true);
        isInVariantSynchronous.mockImplementation(
            (testId, variantId) => variantId === 'variant'
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should include xaxis adapter if condition is true ', () => {
        config.set('switches.prebidXaxis', true);
        expect(getBidders()).toEqual(['ix', 'xhb']);
    });

    test('should not include xaxis adapter if condition is false ', () => {
        config.set('switches.prebidXaxis', false);
        expect(getBidders()).toEqual(['ix']);
    });

    test('should return correct xaxis adapter params for top-above-nav', () => {
        config.set('switches.prebidXaxis', true);
        containsLeaderboard.mockReturnValueOnce(true);
        containsMpu.mockReturnValueOnce(false);
        containsDmpu.mockReturnValueOnce(false);
        containsMobileSticky.mockReturnValueOnce(false);
        getBreakpointKey.mockReturnValue('D');

        const xaxisBids = bids('dfp-ad--top-above-nav', [
            [728, 90],
            [970, 250],
        ]);
        expect(xaxisBids[2].params).toEqual({
            placementId: 15900187,
        });
        expect(xaxisBids[3].params).toEqual({
            placementId: 15900184,
        });
    });

    test('should return not match param if size not matching', () => {
        config.set('switches.prebidXaxis', true);
        containsLeaderboard.mockReturnValueOnce(true);
        containsMpu.mockReturnValueOnce(false);
        containsDmpu.mockReturnValueOnce(false);
        containsMobileSticky.mockReturnValueOnce(false);

        const xaxisBids = bids('dfp-ad--top-above-nav', [[123, 123]]);

        expect(xaxisBids[1].params).toEqual({
            placementId: 15900184,
        });
    });
});
