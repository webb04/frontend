// @flow
import { getSync as getSync_ } from 'lib/geolocation';
import {
    getBreakpoint as getBreakpoint_,
    isBreakpoint as isBreakpoint_,
} from 'lib/detect';
import config from 'lib/config';
import {
    getLargestSize,
    getBreakpointKey,
    isInRowRegion,
    isInUkRegion,
    shouldIncludeAdYouLike,
    shouldIncludeAppNexus,
    shouldIncludeImproveDigital,
    shouldIncludeOpenx,
    shouldIncludeOzone,
    shouldIncludeSonobi,
    shouldIncludeTrustX,
    shouldIncludeXaxis,
    stripMobileSuffix,
    stripTrailingNumbersAbove1,
    stripDfpAdPrefixFrom,
    removeFalseyValues,
    shouldIncludeMobileSticky,
} from './utils';

const getSync: any = getSync_;
const getBreakpoint: any = getBreakpoint_;
const isBreakpoint: any = isBreakpoint_;

jest.mock('lodash/once', () => a => a);

jest.mock('lib/geolocation', () => ({
    getSync: jest.fn(() => 'GB'),
}));

jest.mock('lib/detect', () => ({
    getBreakpoint: jest.fn(() => 'mobile'),
    hasPushStateSupport: jest.fn(() => true),
    isBreakpoint: jest.fn(),
}));

jest.mock('common/modules/experiments/ab', () => ({
    isInVariantSynchronous: jest.fn(
        (testId, variantId) => variantId === 'variant'
    ),
}));

jest.mock('common/modules/experiments/ab-tests');

/* eslint-disable guardian-frontend/no-direct-access-config */
const resetConfig = () => {
    config.set('switches.prebidAppnexusUkRow', undefined);
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
    config.set('page.contentType', 'Article');
    config.set('page.section', 'Magic');
    config.set('page.edition', 'UK');
    config.set('page.isDev', false);
};

describe('Utils', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        resetConfig();
    });

    test('stripPrefix correctly strips valid cases', () => {
        const validStrips: Array<Array<string>> = [
            ['dfp-ad--slot', 'slot'],
            ['slot', 'slot'],
            ['dfp-ad--', ''],
        ];

        validStrips.forEach(([stringToStrip, result]) => {
            expect(stripDfpAdPrefixFrom(stringToStrip)).toEqual(result);
        });
    });

    test('stripPrefix correctly behaves in invalid case', () => {
        expect(stripDfpAdPrefixFrom(' dfp-ad--slot')).toEqual(' dfp-ad--slot');
    });

    test('getLargestSize should return only one and the largest size', () => {
        expect(getLargestSize([[300, 250]])).toEqual([300, 250]);
        expect(getLargestSize([[300, 250], [300, 600]])).toEqual([300, 600]);
        expect(getLargestSize([[970, 250], [728, 80]])).toEqual([970, 250]);
    });

    test('getLargestSize should return null if no sizes exist', () => {
        expect(getLargestSize([])).toEqual(null);
    });

    test('getBreakpointKey should find the correct key', () => {
        const breakpoints = ['mobile', 'phablet', 'tablet', 'desktop', 'wide'];
        const results = [];
        for (let i = 0; i < breakpoints.length; i += 1) {
            getBreakpoint.mockReturnValueOnce(breakpoints[i]);
            results.push(getBreakpointKey());
        }
        expect(results).toEqual(['M', 'T', 'T', 'D', 'D']);
    });

    test('shouldIncludeAppNexus should return true if geolocation is AU', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('AU');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true if geolocation is NZ', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('NZ');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return false if geolocation is US', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('US');
        expect(shouldIncludeAppNexus()).toBe(false);
    });

    test('shouldIncludeAppNexus should return false if geolocation is CA', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('CA');
        expect(shouldIncludeAppNexus()).toBe(false);
    });

    test('shouldIncludeAppNexus should return true if geolocation is GB', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('GB');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should otherwise return false', () => {
        config.switches.prebidAppnexusUkRow = true;
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeAppNexus()).toBe(true);
        }
    });

    test('shouldIncludeAppNexus should return false for UK region if UK switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('GB');
        expect(shouldIncludeAppNexus()).toBe(false);
    });

    test('shouldIncludeAppNexus should return false for UK region if UK switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeAppNexus()).toBe(false);
        }
    });

    test('shouldIncludeAppNexus should return true for AU region if UK region is switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('AU');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true for NZ region if UK region is switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('NZ');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeOpenx should return true if geolocation is GB', () => {
        getSync.mockReturnValueOnce('GB');
        expect(shouldIncludeOpenx()).toBe(true);
    });

    test('shouldIncludeOpenx should return true if within ROW region', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'IE'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeOpenx()).toBe(true);
        }
    });

    test('shouldIncludeOpenx should return false if within US region', () => {
        const testGeos = ['CA', 'US'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeOpenx()).toBe(false);
        }
    });

    test('shouldIncludeOpenx should return true if within AU region', () => {
        const testGeos = ['NZ', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeOpenx()).toBe(true);
        }
    });

    test('shouldIncludeTrustX should return true if geolocation is US', () => {
        getSync.mockReturnValueOnce('US');
        expect(shouldIncludeTrustX()).toBe(true);
    });

    test('shouldIncludeTrustX should otherwise return false', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeTrustX()).toBe(false);
        }
    });

    test('shouldIncludeOzone should return false for excluded geolocations', () => {
        const excludedGeos = ['US', 'CA', 'NZ', 'AU'];
        for (let i = 0; i < excludedGeos.length; i += 1) {
            getSync.mockReturnValue(excludedGeos[i]);
            expect(shouldIncludeOzone()).toBe(false);
        }
    });

    test('shouldIncludeOzone should return true for GB and ROW', () => {
        const includedGeos = ['GB', 'FR', 'SA'];
        for (let i = 0; i < includedGeos.length; i += 1) {
            getSync.mockReturnValueOnce(includedGeos[i]);
            expect(shouldIncludeOzone()).toBe(true);
        }
    });

    test('shouldIncludeImproveDigital should return true if geolocation is GB', () => {
        getSync.mockReturnValue('GB');
        expect(shouldIncludeImproveDigital()).toBe(true);
    });

    test('shouldIncludeImproveDigital should return true if geolocation is ROW', () => {
        getSync.mockReturnValue('FR');
        expect(shouldIncludeImproveDigital()).toBe(true);
    });

    test('shouldIncludeImproveDigital should return false if geolocation is AU', () => {
        getSync.mockReturnValue('AU');
        expect(shouldIncludeImproveDigital()).toBe(false);
    });

    test('shouldIncludeImproveDigital should return false if geolocation is US', () => {
        getSync.mockReturnValue('US');
        expect(shouldIncludeImproveDigital()).toBe(false);
    });

    test('shouldIncludeXaxis should be true if geolocation is GB', () => {
        config.set('page.isDev', true);
        getSync.mockReturnValue('GB');
        expect(shouldIncludeXaxis()).toBe(true);
    });

    test('shouldIncludeXaxis should be false if geolocation is not GB', () => {
        config.set('page.isDev', true);
        const testGeos = [
            'FK',
            'GI',
            'GG',
            'IM',
            'JE',
            'SH',
            'AU',
            'US',
            'CA',
            'NZ',
        ];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeXaxis()).toBe(false);
        }
    });

    test('shouldIncludeSonobi should return true if geolocation is US', () => {
        const testGeos = ['US', 'CA'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeSonobi()).toBe(true);
        }
    });

    test('shouldIncludeSonobi should otherwise return false', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeSonobi()).toBe(false);
        }
    });

    test('stripMobileSuffix', () => {
        expect(stripMobileSuffix('top-above-nav--mobile')).toBe(
            'top-above-nav'
        );
        expect(stripMobileSuffix('inline1--mobile')).toBe('inline1');
    });

    test('stripTrailingNumbersAbove1', () => {
        expect(stripTrailingNumbersAbove1('inline1')).toBe('inline1');
        expect(stripTrailingNumbersAbove1('inline2')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline10')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline23')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline101')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline456')).toBe('inline');
    });

    test('shouldIncludeAdYouLike when not in any tests', () => {
        expect(shouldIncludeAdYouLike([[300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[300, 600], [300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[728, 90]])).toBe(false);
    });

    test('removeFalseyValues correctly remove non-truthy values', () => {
        const result = removeFalseyValues({
            testString: 'non empty string',
            testEmptyString: '',
        });

        expect(result).toEqual({
            testString: 'non empty string',
        });
    });

    test('isInUkRegion should return true if geolocation is GB', () => {
        getSync.mockReturnValue('GB');
        expect(isInUkRegion()).toBe(true);
    });

    test('isInUkRegion should return false if geolocation is not GB', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(isInUkRegion()).toBe(false);
        }
    });

    test('isInRowRegion should return false if geolocation is GB, US, CA, AU or NZ', () => {
        const testGeos = ['GB', 'US', 'CA', 'AU', 'NZ'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(isInRowRegion()).toBe(false);
        }
    });

    test('isInRowRegion should return true if geolocation is not GB, US, CA, AU or NZ', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(isInRowRegion()).toBe(true);
        }
    });

    test('shouldIncludeMobileSticky should be true if location cookie is NA, switch is ON and content is Article on mobiles ', () => {
        config.set('page.contentType', 'Article');
        config.set('switches.mobileStickyLeaderboard', true);
        getSync.mockReturnValue('US');
        isBreakpoint.mockReturnValue(true);
        expect(shouldIncludeMobileSticky()).toBe(true);
    });

    test('shouldIncludeMobileSticky should be false if all conditions true except content type ', () => {
        config.set('page.contentType', 'Network Front');
        config.set('switches.mobileStickyLeaderboard', true);
        isBreakpoint.mockReturnValue(true);
        getSync.mockReturnValue('US');
        expect(shouldIncludeMobileSticky()).toBe(false);
    });

    test('shouldIncludeMobileSticky should be false if all conditions true except switch', () => {
        config.set('page.contentType', 'Article');
        isBreakpoint.mockReturnValue(true);
        config.set('switches.mobileStickyLeaderboard', false);
        getSync.mockReturnValue('US');
        expect(shouldIncludeMobileSticky()).toBe(false);
    });

    test('shouldIncludeMobileSticky should be false if all conditions true except continent', () => {
        config.set('page.contentType', 'Article');
        config.set('switches.mobileStickyLeaderboard', true);
        isBreakpoint.mockReturnValue(true);
        getSync.mockReturnValue('GB');
        expect(shouldIncludeMobileSticky()).toBe(false);
    });

    test('shouldIncludeMobileSticky should be false if all conditions true except mobile', () => {
        config.set('page.contentType', 'Article');
        config.set('switches.mobileStickyLeaderboard', true);
        isBreakpoint.mockReturnValue(false);
        getSync.mockReturnValue('US');
        expect(shouldIncludeMobileSticky()).toBe(false);
    });

    test('shouldIncludeMobileSticky should be true if test param exists irrespective of other conditions', () => {
        config.set('page.contentType', 'Network Front');
        config.set('switches.mobileStickyLeaderboard', false);
        isBreakpoint.mockReturnValue(false);
        getSync.mockReturnValue('US');
        window.location.hash = '#mobile-sticky';
        expect(shouldIncludeMobileSticky()).toBe(true);
    });
});
