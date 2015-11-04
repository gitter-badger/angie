/**
 * @module cookie.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 10/29/2015
 */

// System Modules
import cookie from      'cookie';
import $Injector from   'angie-injector';

// TODO lookup getters and setters on classes
class $$CookieFactory {
    constructor() {
        this.$$cookies = {};
    }
    get (key) {
        let $request;
        try {
            request = $Injector.get('$request');
        } catch(e) {
            request = {};
        }

        if (
            !Object.keys(this.$$cookies).length &&
            $request.headers &&
            $request.headers.hasOwnProperty('cookie')
        ) {
            this.$$cookies = cookie.parse($request.headers.cookie);
        }

        if (this.$$cookies.hasOwnProperty(key)) {

            console.log(this.$$cookies[ key ]);
            // TODO this could be the root of your problem
            return this.$$cookies[ key ].value;
        }
    }
    set (key, value, expiry = +new Date()) {
        let cookieStr = '';

        this.$$cookies[ key ] = {
            value,
            expiry: new Date(expiry).toUTCString()
        };

        for (let key in this.$$cookies) {
            let value = this.$$cookies[ key ];
            cookieStr += `${key}=${value.value};expires=${value.expiry},`;
        }

        // Cannot really use getters and setters here
        $Injector.get('$response').setHeader('Set-Cookie', cookieStr);
        return true;
    }
}

const $Cookie = new $$CookieFactory();
export default $Cookie;