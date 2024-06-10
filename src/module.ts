import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { authProvidersExtensionPoint } from '@backstage/plugin-auth-node';
import { saml } from './provider';

// use by Create entity for user authorized
import { DEFAULT_NAMESPACE, stringifyEntityRef } from '@backstage/catalog-model';


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

