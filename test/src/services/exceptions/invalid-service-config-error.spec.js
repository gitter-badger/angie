// Test Modules
import { expect } from          'chai';
import simple, { mock } from    'simple-mock';

// System Modules
import { cyan } from            'chalk';
import $LogProvider from        'angie-log';

// Angie Modules
const TEST_ENV =                global.TEST_ENV || 'src',
    $Exceptions =               require(`../../../../${TEST_ENV}/services/exceptions`);

describe('$$InvalidServiceConfigError', function() {
    const msgFn = (t, n) => `Invalid configuration for ${t} ${cyan(n)}`;

    it('constructor', function() {
        const msg = msgFn('service', 'test'),
            e = new $Exceptions.$$InvalidServiceConfigError('test');
        expect($LogProvider.error.calls[0].args[0]).to.eq(msg);
        expect(e).to.deep.eq(new SyntaxError(msg));
    });
});