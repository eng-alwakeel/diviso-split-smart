 /**
  * Google AdSense Offerwall Service
  * 
  * Handles triggering and managing Google AdSense Offerwall
  * for rewarded ad experiences.
  */
 
 import '@/types/googlefc';
 
 // Track offerwall state
 let offerwallActive = false;
 let offerwallResolver: ((success: boolean) => void) | null = null;
 
 /**
  * Initialize Google Funding Choices callback queue
  */
 export function initGoogleFC(): void {
   if (typeof window !== 'undefined') {
     window.googlefc = window.googlefc || {};
     window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
   }
 }
 
 /**
  * Initialize controlled messaging for paid users
  * This suppresses automatic offerwall display for subscribers
  * 
  * @param isPaidUser - Whether the current user has an active subscription
  */
 export function initControlledMessaging(isPaidUser: boolean): void {
   initGoogleFC();
   
   window.googlefc!.callbackQueue!.push(() => {
     window.googlefc!.controlledMessagingFunction = (message) => {
       const messageType = message.getMessageType();
       const isOfferwall = messageType === window.googlefc?.MessageTypeEnum?.OFFERWALL;
       
       if (isPaidUser && isOfferwall) {
         // Suppress offerwall for paid users
         message.proceed(false);
         console.log('[AdSense] Offerwall suppressed for paid user');
       } else {
         // Allow message to proceed
         message.proceed(true);
       }
     };
   });
 }
 
 /**
  * Trigger the AdSense Offerwall
  * 
  * Since Google AdSense Offerwall cannot be triggered programmatically,
  * we open a new window/iframe with the offerwall trigger parameters.
  * 
  * @returns Promise resolving to true if user completed the offerwall
  */
 export async function triggerOfferwall(): Promise<boolean> {
   return new Promise((resolve) => {
     if (offerwallActive) {
       console.warn('[AdSense] Offerwall already active');
       resolve(false);
       return;
     }
     
     offerwallActive = true;
     offerwallResolver = resolve;
     
     // Create offerwall URL with trigger parameters
     const baseUrl = window.location.origin;
     const offerwallUrl = `${baseUrl}/?fc=alwaysshow&fctype=monetization`;
     
     // Create overlay container
     const overlay = document.createElement('div');
     overlay.id = 'adsense-offerwall-overlay';
     overlay.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       z-index: 99999;
       background: rgba(0, 0, 0, 0.85);
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
     `;
     
     // Create iframe for offerwall
     const iframe = document.createElement('iframe');
     iframe.id = 'adsense-offerwall-iframe';
     iframe.src = offerwallUrl;
     iframe.style.cssText = `
       width: 100%;
       height: 100%;
       max-width: 600px;
       max-height: 80vh;
       border: none;
       border-radius: 12px;
       background: white;
     `;
     
     // Create close button
     const closeButton = document.createElement('button');
     closeButton.innerHTML = '✕ إغلاق / Close';
     closeButton.style.cssText = `
       margin-top: 16px;
       padding: 12px 24px;
       background: rgba(255, 255, 255, 0.1);
       color: white;
       border: 1px solid rgba(255, 255, 255, 0.3);
       border-radius: 8px;
       cursor: pointer;
       font-size: 14px;
       font-family: inherit;
     `;
     
     // Create instruction text
     const instruction = document.createElement('p');
     instruction.innerHTML = 'شاهد الإعلان للحصول على عملية مجانية<br/>Watch the ad to unlock one action';
     instruction.style.cssText = `
       color: white;
       text-align: center;
       margin-bottom: 16px;
       font-size: 16px;
       line-height: 1.6;
     `;
     
     // Close handler
     const handleClose = (success: boolean) => {
       if (document.body.contains(overlay)) {
         document.body.removeChild(overlay);
       }
       window.removeEventListener('message', handleMessage);
       offerwallActive = false;
       
       if (offerwallResolver) {
         offerwallResolver(success);
         offerwallResolver = null;
       }
     };
     
     closeButton.onclick = () => handleClose(false);
     
     // Listen for completion message from iframe
     const handleMessage = (event: MessageEvent) => {
       // Check if message is from our iframe
       if (event.origin !== window.location.origin) return;
       
       if (event.data?.type === 'offerwall_complete') {
         handleClose(event.data.success === true);
       } else if (event.data?.type === 'offerwall_started') {
         console.log('[AdSense] Offerwall ad started');
       }
     };
     
     window.addEventListener('message', handleMessage);
     
     // Assemble and show overlay
     overlay.appendChild(instruction);
     overlay.appendChild(iframe);
     overlay.appendChild(closeButton);
     document.body.appendChild(overlay);
     
     // Auto-close after timeout (2 minutes)
     setTimeout(() => {
       if (offerwallActive) {
         console.log('[AdSense] Offerwall timeout - assuming completion');
         handleClose(true); // Assume completion if user waited
       }
     }, 120000);
     
     // Also listen for iframe load to detect if offerwall appeared
     iframe.onload = () => {
       console.log('[AdSense] Offerwall iframe loaded');
       
       // Try to communicate with the iframe
       setTimeout(() => {
         try {
           iframe.contentWindow?.postMessage({ type: 'offerwall_ready' }, '*');
         } catch (e) {
           console.log('[AdSense] Cannot communicate with iframe (expected due to cross-origin)');
         }
       }, 1000);
     };
   });
 }
 
 /**
  * Check if offerwall is currently active
  */
 export function isOfferwallActive(): boolean {
   return offerwallActive;
 }
 
 /**
  * Close the offerwall manually
  * 
  * @param success - Whether to mark as successful
  */
 export function closeOfferwall(success: boolean = false): void {
   const overlay = document.getElementById('adsense-offerwall-overlay');
   if (overlay) {
     document.body.removeChild(overlay);
   }
   
   offerwallActive = false;
   
   if (offerwallResolver) {
     offerwallResolver(success);
     offerwallResolver = null;
   }
 }
 
 /**
  * Signal offerwall completion from within the offerwall page
  * Call this when user completes watching an ad
  */
 export function signalOfferwallComplete(success: boolean = true): void {
   // Post message to parent window
   if (window.parent !== window) {
     window.parent.postMessage({ type: 'offerwall_complete', success }, '*');
   }
 }
 
 /**
  * Check if we're currently in the offerwall iframe
  */
 export function isInOfferwallFrame(): boolean {
   // Check URL parameters
   const params = new URLSearchParams(window.location.search);
   return params.get('fc') === 'alwaysshow' && params.get('fctype') === 'monetization';
 }