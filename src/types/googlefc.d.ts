 /**
  * TypeScript declarations for Google Funding Choices (googlefc)
  * Used for AdSense Offerwall integration
  */
 
 interface GoogleFCMessage {
   proceed: (shouldProceed: boolean) => void;
   getMessageType: () => number;
 }
 
 interface GoogleFCMessageTypeEnum {
   OFFERWALL: number;
   GDPR_CONSENT: number;
   AD_BLOCK_MESSAGE: number;
 }
 
 interface GoogleFCInitializeResponseEnum {
   ACCESS_NOT_GRANTED: number;
   ACCESS_GRANTED: number;
   ACCESS_UNKNOWN: number;
 }
 
 interface GoogleFCCustomChoiceRegistry {
   register: (choice: GoogleFCCustomChoice) => void;
 }
 
 interface GoogleFCCustomChoice {
   /**
    * Initialize custom choice
    * @returns Promise resolving to one of InitializeResponseEnum values
    */
   initialize: (params: { onAccessGranted: () => void }) => Promise<number>;
   
   /**
    * Show the custom choice UI
    * @returns Promise resolving to boolean indicating success
    */
   show: () => Promise<boolean>;
 }
 
 interface GoogleFC {
   /**
    * Queue of callbacks to execute when googlefc is ready
    */
   callbackQueue?: Array<() => void>;
   
   /**
    * Controlled messaging function for customizing message display
    */
   controlledMessagingFunction?: (message: GoogleFCMessage) => void;
   
   /**
    * Enum for message types
    */
   MessageTypeEnum?: GoogleFCMessageTypeEnum;
   
   /**
    * Offerwall configuration
    */
   offerwall?: {
     customchoice?: {
       registry?: GoogleFCCustomChoiceRegistry;
       InitializeResponseEnum?: GoogleFCInitializeResponseEnum;
     };
   };
   
   /**
    * Show a specific message type
    */
   showRevocationMessage?: () => void;
 }
 
 declare global {
   interface Window {
     googlefc?: GoogleFC;
   }
 }
 
 export {};