# Module @internal/backstage-plugin-auth-backend-module-saml-provide to register SAML provider
- Author: JMF 
- Date: 09/06/2024


## Take directory and files from https://github.com/backstage/backstage/tree/master/plugins/auth-backend

* For testing :
    - use start-saml-idp.sh
        - From https://github.com/backstage/backstage/tree/master/plugins/auth-backend/scripts
    - Generate certificat with the command inside the script
    - Modify the script to add certificats

        ```exec npx saml-idp --acsUrl "http://localhost:7007/api/auth/saml/handler/frame" --audience "http://localhost:7007" --port 7001  --cert=$PATH_TO_FILE"/idp-public-cert.pem" --key=$PATH_TO_FILE"/idp-private-key.pem"```

* dependenies:
  - "@node-saml/passport-saml"
  - "@types/passport"

* for the plugin :
    - from src, take
        - ./lib
    - from providers, take
        - createAuthProviderIntegration.ts
        - prepareBackstageIdentityResponse.ts
    - from providers/saml
        - types.ts
        - provider.ts


- Modify the module.ts to create an extension of auth with :

```
export const authModuleSaml = createBackendModule({
  pluginId: 'auth',
  moduleId: 'saml',
  register(reg) {
    reg.registerInit({
      deps: { 
        logger: coreServices.logger,
        providers: authProvidersExtensionPoint,
      },
      async init({ logger, providers }) {
        
        providers.registerProvider({
          providerId: 'saml',
          factory: saml.create({
            signIn: {
              resolver: async (info, ctx) => {

                const {
                  profile: { email },
                } = info;
                if (!email) {
                  throw new Error('Profile contained no email');
                }
                  
                // Create entity for user authorized
                const userId = email.split('@')[0];
                const entityRef = stringifyEntityRef({
                  kind: 'User',
                  namespace: DEFAULT_NAMESPACE,
                  name: userId,
                });
                const token = await ctx.issueToken({
                  claims: {
                    sub: entityRef,
                    ent: [entityRef],
                  },
                });
                return token;
                // End

                // Log in if exist in catalog
                // const [name] = email.split('@');
                // return ctx.signInWithCatalogUser({
                //   entityRef: { name },
                // });
                // End
                
              },
            },    
            
          }),
                    
        });
        
      },
    });
  },
});
```



* Add the load of module in index.ts  of backend

```backend.add(import('@internal/backstage-plugin-auth-backend-module-saml-provider'));```

* Modify the api.ts of app to add the apiRef

```
export const samlAuthApiRef: ApiRef<
 ProfileInfoApi & BackstageIdentityApi & SessionApi 
> = createApiRef({
  id: 'internal.auth.saml',
});

....

  createApiFactory({
    api: samlAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      configApi: configApiRef,

    },
    factory: ({ discoveryApi, configApi}) =>
              
              SamlAuth.create({
                   discoveryApi,
                   configApi,
                   provider: {
                   id: 'saml',
                   title: 'Custom saml provider',
                     icon: () => null,
                   },
                 }) ,
          }),
```

* Modify the App.tsx
```
providers={[
...,
    {
        id: 'saml',
        title: 'SAML',
        message: 'Sign in using SAML',
        apiRef: samlAuthApiRef,
    }   
]}
```

* Modify the app-config.yaml
```
.....
auth:
   providers:
    # See https://backstage.io/docs/auth/guest/provider
    guest: {}
    saml:
      entryPoint: http://localhost:7001 
      issuer: passport-saml
      idpcert: MIIDuzCCAqOgAwIBAg........0= 
      audience: http://localhost:7007
....
```

Notice the available variables  :

    callbackUrl: defined by app
    entryPoint: required 
    logoutUrl: optional
    audience: required
    issuer: required
    idpCert: required
    privateKey: optional
    authnContext: optional
    identifierFormat: optional
    decryptionPvk: optional
    signatureAlgorithm: optional
    digestAlgorithm: optional
    acceptedClockSkewMs: optional
    wantAuthnResponseSigned: optional
    wantAssertionsSigned: optional
    appUrl: defined by app 