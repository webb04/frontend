// @flow
/*eslint-disable */
!(function(a9, a, p, s, t, A, g) {
    if (a[a9]) return;
    function q(c, r) {
        a[a9]._Q.push([c, r]);
    }
    a[a9] = {
        init() {
            q('i', arguments);
        },
        fetchBids() {
            q('f', arguments);
        },
        setDisplayBids() {},
        targetingKeys() {
            return [];
        },
        _Q: [],
    };
    A = p.createElement(s);
    A.async = !0;
    A.src = t;
    g = p.getElementsByTagName(s)[0];
    // $FlowFixMe
    g.parentNode.insertBefore(A, g);
})(
    'apstag',
    window,
    document,
    'script',
    '//c.amazon-adsystem.com/aax2/apstag.js'
);
/* eslint-enable */
