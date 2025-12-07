/**
 * Ambient module declaration for openid-client/passport
 * The types exist in node_modules but aren't resolved under 'node' moduleResolution
 */
declare module 'openid-client/passport' {
  import type { TokenEndpointResponse, TokenEndpointResponseHelpers } from 'openid-client';
  import type { AuthenticateCallback } from 'passport';

  export interface VerifyFunction {
    (
      tokens: TokenEndpointResponse & TokenEndpointResponseHelpers,
      verified: AuthenticateCallback
    ): Promise<void>;
  }

  export class Strategy {
    constructor(
      options: {
        name: string;
        config: any;
        scope?: string | string[];
        callbackURL: string;
      },
      verify: VerifyFunction
    );
  }
}


