import { DeliveryError, IContentItem, camelCasePropertyNameResolver, createDeliveryClient } from '@kontent-ai/delivery-sdk';
import { defaultEnvId, defaultPreviewKey, deliveryApiDomain, deliveryPreviewApiDomain } from '../utils/env';
import { contentTypes, Screen } from '../../models';
const sourceTrackingHeaderName = 'X-KC-SOURCE';
const defaultDepth = 10;

const getDeliveryClient = ({ envId, previewApiKey }: ClientConfig) => createDeliveryClient({
  retryStrategy: {
    canRetryError: (error) => {
      return true; // retries all the errors - not effficient but does the job
    },
    maxAttempts: 1
  },
  environmentId: envId,
  globalHeaders: () => [
    {
      header: sourceTrackingHeaderName,
      value: `${process.env.APP_NAME || "n/a"};${process.env.APP_VERSION || "n/a"}`,
    }
  ],
  propertyNameResolver: camelCasePropertyNameResolver,
  proxy: {
    baseUrl: deliveryApiDomain,
    basePreviewUrl: deliveryPreviewApiDomain,
  },
  previewApiKey: defaultEnvId === envId ? defaultPreviewKey : previewApiKey
});

type ClientConfig = {
  envId: string,
  previewApiKey?: string
}

export const getItemByCodename = <ItemType extends IContentItem>(config: ClientConfig, codename: string, usePreview: boolean, languageCodename: string): Promise<ItemType | null> => {
  return getDeliveryClient(config)
    .item(codename)
    .queryConfig({
      usePreviewMode: usePreview,
    })
    .depthParameter(defaultDepth)
    .languageParameter(languageCodename)
    .toPromise()
    .then(res => {
      if (res.response.status === 404) {
        return null;
      }
      return res.data.item as ItemType
    })
    .catch((error) => {
      debugger;
      if (error instanceof DeliveryError) {
        // delivery specific error (e.g. item with codename not found...)
        console.error(error.message, error.errorCode);
        return null;
      } else {
        // some other error
        console.error("HTTP request error", error);
        // throw error;
        return null;
      }
    });
}

export const getItemById = <ItemType extends IContentItem>(config: ClientConfig, id: string, usePreview: boolean, languageCodename: string): Promise<ItemType | null> => {
  return getDeliveryClient(config)
    .items()
    .queryConfig({
      usePreviewMode: usePreview,
    })
    .depthParameter(defaultDepth)
    .limitParameter(1)
    .languageParameter(languageCodename)
    .equalsFilter(`system.id`, id)
    .toPromise()
    .then(res => {
      if (res.response.status === 404) {
        return null;
      }
      return res.data.items[0] as ItemType
    })
    .catch((error) => {
      debugger;
      if (error instanceof DeliveryError) {
        // delivery specific error (e.g. item with codename not found...)
        console.error(error.message, error.errorCode);
        return null;
      } else {
        // some other error
        console.error("HTTP request error", error);
        // throw error;
        return null;
      }
    });
}

export const getItemVariantById = <ItemType extends IContentItem>(config: ClientConfig, id: string, usePreview: boolean, languageCodename: string): Promise<ItemType | null> => {
  return getDeliveryClient(config)
    .items()
    .queryConfig({
      usePreviewMode: usePreview,
    })
    .depthParameter(0)
    .limitParameter(1)
    .languageParameter(languageCodename)
    .equalsFilter('system.language', languageCodename)
    .equalsFilter(`system.id`, id)
    .toPromise()
    .then(res => {
      if (res.response.status === 404 || res.data.items.length === 0) {
        return null;
      }
      return res.data.items[0] as ItemType
    })
    .catch((error) => {
      debugger;
      if (error instanceof DeliveryError) {
        // delivery specific error (e.g. item with codename not found...)
        console.error(error.message, error.errorCode);
        return null;
      } else {
        // some other error
        console.error("HTTP request error", error);
        // throw error;
        return null;
      }
    });
}

export const getItemByUrlSlug = <ItemType extends IContentItem>(config: ClientConfig, url: string, elementCodename: string = "url", usePreview: boolean, languageCodename: string): Promise<ItemType | null> => {
  return getDeliveryClient(config)
    .items()
    .queryConfig({
      usePreviewMode: usePreview,
    })
    .depthParameter(defaultDepth)
    .limitParameter(1)
    .languageParameter(languageCodename)
    .equalsFilter(`elements.${elementCodename}`, url)
    .toPromise()
    .then(res => {
      if (res.response.status === 404) {
        return null;
      }
      return res.data.items[0] as ItemType
    })
    .catch((error) => {
      debugger;
      if (error instanceof DeliveryError) {
        // delivery specific error (e.g. item with codename not found...)
        console.error(error.message, error.errorCode);
        return null;
      } else {
        // some other error
        console.error("HTTP request error", error);
        // throw error;
        return null;
      }
    });
}

export const getScreenByCodename = (config: ClientConfig, codename: string, usePreview: boolean) =>
  getDeliveryClient(config)
    .item(codename)
    .queryConfig({
      usePreviewMode: usePreview,
    })
    .toPromise()
    .then(res => {
      if (res.response.status === 404) {
        return null;
      }
      return res.data.item as Screen
    })
    .catch((error) => {
      debugger;
      if (error instanceof DeliveryError) {
        // delivery specific error (e.g. item with codename not found...)
        console.error(error.message, error.errorCode);
        return null;
      } else {
        // some other error
        console.error("HTTP request error", error);
        // throw error;
        return null;
      }
    });