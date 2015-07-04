'use strict'; 'use strong';

// Global Modules
// TODO if this is used in other places, we do not need to redefine it
import 'es6-module-loader';

// Test Modules
import {expect} from                'chai';
import simple, {mock} from          'simple-mock';

// System Modules
import fs from                      'fs';

// Angie Modules
import {angular} from               '../../src/Angular';
import util from                    '../../src/util/util';
import $ExceptionsProvider from     '../../src/util/$ExceptionsProvider';
import $log from                    '../../src/util/$LogProvider';

describe('Angular', function() {
    let app,
        noop;

    beforeEach(function() {

        // jscs:disable
        app = new angular();
        // jscs:enable

        noop = angular.noop;
    });
    it('test extension of static angular methods from util', function() {
        expect(angular.extend).to.be.a('function');
    });
    describe('constructor', function() {
        it('test constructor properly instantiates app properties', function() {
            expect(app.constants).to.deep.eq({});
            expect(app.configs).to.deep.eq([]);
            expect(app.services).to.deep.eq({});
            expect(app.Controllers).to.deep.eq({});
            expect(app.Models).to.deep.eq({});
            expect(app.directives).to.deep.eq({});
            expect(app._registry).to.deep.eq({});
            expect(app._dependencies).to.deep.eq([]);
        });
    });
    describe('_register', function() {
        beforeEach(function() {
            mock($log, 'warn', noop);
        });
        it('test register returns the app object', function() {
            expect(app._register()).to.deep.eq(app);
        });
        it('test register called without a name fails', function() {
            app._register('directives', null, {});
            expect(app._registry).to.deep.eq({});
            expect(app.directives).to.deep.eq({});
            expect($log.warn).to.have.been.called;
        });
        it('test register called without an obj fails', function() {
            app._register('directives', 'test', null);
            expect(app._registry).to.deep.eq({});
            expect(app.directives).to.deep.eq({});
            expect($log.warn).to.have.been.called;
        });
        it('test register properly registers a provider', function() {
            app._register('directives', 'test', 'test');
            expect(app._registry.test).to.eq('directives');
            expect(app.directives.test).to.deep.eq('test');
        });
    });
    describe('directive', function() {
        beforeEach(function() {
            mock(app, '_register', noop);
        });
        it('test Controller and string type', function() {
            let obj = {
                Controller: 'test'
            };
            app.directive('test', function() {
                return obj;
            });
            expect(app._register.calls[0].args).to.deep.eq(
                [ 'directives', 'test', obj ]
            );
        });
        it('test Controller deleted if not string type', function() {
            let obj = {
                Controller: noop()
            };
            app.directive('test', function() {
                return obj;
            });
            expect(app._register.calls[0].args).to.deep.eq(
                [ 'directives', 'test', obj ]
            );
            expect(obj.Controller).to.be.undefined;
        });
        it(
            'text $ExceptionsProvider called when there is a not controller and ' +
            'directive is an API View',
            function() {
                let obj = {
                    type: 'APIView'
                };
                mock($ExceptionsProvider, '$$invalidDirectiveConfig', noop);
                app.directive('test', function() {
                    return obj;
                });
                expect(
                    $ExceptionsProvider.$$invalidDirectiveConfig
                ).to.have.been.called;
            }
        );
    });
    describe('constant, service, Controller', function() {
        beforeEach(function() {
            mock(app, '_register', noop);
        });
        it('test constant makes a call to _register', function() {
            app.constant('test', 'test');
            expect(app._register.calls[0].args).to.deep.eq([
                'constants',
                'test',
                'test'
            ]);
        });
        it('test service makes a call to _register', function() {
            app.service('test', 'test');
            expect(app._register.calls[0].args).to.deep.eq([
                'services',
                'test',
                'test'
            ]);
        });
        it('test Controller makes a call to _register', function() {
            app.Controller('test', 'test');
            expect(app._register.calls[0].args).to.deep.eq([
                'Controllers',
                'test',
                'test'
            ]);
        });
    });
    describe('config', function() {
        beforeEach(function() {
            mock($log, 'warn', noop);
        });
        it('test config returns app', function() {
            expect(app.config()).to.deep.eq(app);
        });
        it('test config not added as string', function() {
            app.config('test');
            expect(app.configs).to.deep.eq([]);
            expect($log.warn).to.have.been.called;
        });
        it('test config added when called with function', function() {
            app.config(noop);
            expect(app.configs[0]).to.deep.eq({
                fn: noop,
                fired: false
            });
            expect($log.warn).to.not.have.been.called;
        });
    });
    describe('_tearDown', function() {
        beforeEach(function() {
            app.service('test', {});
        });
        it('test _tearDown returns app', function() {
            expect(app._tearDown()).to.deep.eq(app);
        });
        it('test _tearDown called with no name does nothing', function() {
            app._tearDown();
            expect(app._registry.test).to.eq('services');
            expect(app.services.test).to.deep.eq({});
        });
        it('test _tearDown called with an improper service name', function() {
            app._tearDown('test1');
            expect(app._registry.test).to.eq('services');
            expect(app.services.test).to.deep.eq({});
        });
        it('test _tearDown called with a proper service name', function() {
            app._tearDown('test');
            expect(app._registry.test).to.be.undefined;
            expect(app.service.test).to.be.undefined;
        });
    });
    describe('loadDependencies', function() {
        beforeEach(function() {
            mock(util, 'removeTrailingSlashes', (v) => v);
            mock(fs, 'readFileSync', () => '{ "test": "test" }');
            mock($log, 'error', noop);
            mock(app, 'bootstrap', () => new Promise());
        });
        afterEach(() => simple.restore());
        it('test called with no dependencies', function() {
            expect(app.loadDependencies().val).to.deep.eq([]);
        });
        it('test called with dependencies', function() {
            expect(app.loadDependencies([ 'test' ]).val.length).to.eq(1);
            expect(util.removeTrailingSlashes.calls[0].args[0]).to.eq('test');
            expect(fs.readFileSync.calls[0].args[0]).to.eq('test/AngieFile.json');
            expect(app.bootstrap).to.have.been.called;
        });
        it('test invalid JSON in AngieFile', function() {
            fs.readFileSync = () => '{,}';
            app.loadDependencies([ 'test' ]);
            expect(util.removeTrailingSlashes.calls[0].args[0]).to.eq('test');
            expect($log.error).to.have.been.called;
            expect(app.bootstrap).to.not.have.been.called;
        });
    });
    describe('bootstrap', function() {
        let spy;

        beforeEach(function() {
            mock(fs, 'readdirSync', () => [ 'test' ]);
            mock(System, 'import', (v) => v);
            simple.mock(Promise, 'all');
            app.configs = [
                {
                    fn: (spy = simple.spy())
                }
            ];
        });
        afterEach(() => simple.restore());
        it('test bootstrap with non-js files', function() {
            app.bootstrap();
            expect(System.import).to.not.have.been.called;
            expect(Promise.all.calls[0].args[0]).to.deep.eq([]);
            expect(spy).to.have.been.called;
            expect(app.configs[0].fired).to.be.true;
        });
        it('test bootstrap', function() {
            fs.readdirSync.returnWith([ 'test.js' ]);
            app.bootstrap();
            expect(System.import).to.have.been.called;
            expect(Promise.all.calls[0].args[0]).to.deep.eq(
                [ 'test.js', 'test.js' ]
            );
            expect(spy).to.have.been.called;
            expect(app.configs[0].fired).to.be.true;
        });
        it('test configs not called more than once', function() {
            app.configs[0].fired = true;
            app.bootstrap();
            expect(spy).to.not.have.been.called;
        });
    });
});

