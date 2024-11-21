export type PlaidAccountType = "depository" | "credit" | "loan" | "investment" | "other";

export type PlaidAccountVerificationStatus =
  | "pending_automatic_verification"
  | "pending_manual_verification"
  | "manually_verified"
  | "verification_expired"
  | "verification_failed"
  | "database_matched"
  | "database_insights_pending";

export type PlaidAccountTransferStatus = "COMPLETE" | "INCOMPLETE";

export type PlaidAccount = {
  /** The Plaid account_id */
  readonly id: string;
  /** The official account name */
  readonly name: string;
  /** The last 2-4 alphanumeric characters of an account's official account number. Note that the mask may be non-unique
   * between an Item's accounts. It may also not match the mask that the bank displays to the user. */
  readonly mask: string | null;
  readonly type: PlaidAccountType;
  readonly subtype: string;
  /** Indicates an Item's micro-deposit-based verification or database verification status. */
  readonly verification_status: PlaidAccountVerificationStatus | null;
  /** If micro-deposit verification is being used, indicates whether the account being verified is a business or personal
   * account. */
  readonly class_type: string | null;
};

export type PlaidInstitution = {
  readonly name: string;
  readonly institution_id: string;
};

/** See https://plaid.com/docs/link/web/#link-web-onexit-metadata for more details */
export type PlaidExitStatus =
  | "requires_questions"
  | "requires_selections"
  | "requires_code"
  | "choose_device"
  | "requires_credentials"
  | "requires_account_selection"
  | "requires_oauth"
  | "institution_not_found"
  | "institution_not_supported";

export type PlaidLinkError = {
  /** A broad categorization of the error. */
  readonly error_type: string;
  /** The particular error code. Each error_type has a specific set of error_codes. */
  readonly error_code: string;
  /** A developer-friendly representation of the error code. */
  readonly error_message: string;
  /** A user-friendly representation of the error code. null if the error is not related to user action. This may
   * change over time and is not safe for programmatic use. */
  readonly display_message: string | null;
};

export type PlaidLinkOnSuccessMetadata = {
  /** An institution object. If the Item was created via Same-Day micro-deposit verification, will be null. */
  readonly institution: PlaidInstitution | null;
  /** A list of accounts attached to the connected Item. If Account Select is enabled via the developer dashboard,
   * accounts will only include selected accounts */
  readonly accounts: PlaidAccount[];
  /** A unique identifier associated with a user's actions and events through the Link flow. Include this identifier when
   * opening a support ticket for faster turnaround. */
  readonly link_session_id: string;
  /** The status of a transfer. Returned only when Transfer UI is implemented. */
  readonly transfer_status: PlaidAccountTransferStatus | null;
};

export type PlaidLinkOnExitMetadata = {
  readonly institution: PlaidInstitution | null;
  // see possible values for status at https://plaid.com/docs/link/web/#link-web-onexit-status
  readonly status: PlaidExitStatus;
  /** A unique identifier associated with a user's actions and events through the Link flow. Include this identifier
   * when opening a support ticket for faster turnaround. */
  readonly link_session_id: string;
  /** The request ID for the last request made by Link. This can be shared with Plaid Support to expedite investigation. */
  readonly request_id: string;
};

export interface PlaidLinkOnEventMetadata {
  /** The account number mask extracted from the user-provided account number. If the user-inputted account number is four
   * digits long, account_number_mask is empty. Emitted by `SUBMIT_ACCOUNT_NUMBER`. */
  readonly account_numbe_mask: string | null;
  /** The error type that the user encountered. Emitted by: `ERROR`, `EXIT`. */
  readonly error_type: string | null;
  /** The error code that the user encountered. Emitted by `ERROR`, `EXIT`. */
  readonly error_code: string | null;
  /** The error message that the user encountered. Emitted by: `ERROR`, `EXIT`. */
  readonly error_message: string | null;
  /** The status key indicates the point at which the user exited the Link flow. Emitted by: `EXIT` */
  readonly exit_status: string | null;
  /** The ID of the selected institution. Emitted by: all events. */
  readonly institution_id: string | null;
  /** The name of the selected institution. Emitted by: all events. */
  readonly institution_name: string | null;
  /** The query used to search for institutions. Emitted by: `SEARCH_INSTITUTION`. */
  readonly institution_search_query: string | null;
  /** Indicates if the current Link session is an update mode session. Emitted by: `OPEN`. */
  readonly is_update_mode: string | null;
  /** The reason this institution was matched. This will be either returning_user or routing_number if emitted by:
   * `MATCHED_SELECT_INSTITUTION`. Otherwise, this will be `SAVED_INSTITUTION` or `AUTO_SELECT_SAVED_INSTITUTION` if
   * emitted by: `SELECT_INSTITUTION`. */
  readonly match_reason: string | null;
  /** The routing number submitted by user at the micro-deposits routing number pane. Emitted by `SUBMIT_ROUTING_NUMBER`. */
  readonly routing_number: string | null;
  /** If set, the user has encountered one of the following `MFA` types: code, device, questions, selections. Emitted by:
   * `SUBMIT_MFA` and `TRANSITION_VIEW` when view_name is `MFA` */
  readonly mfa_type: string | null;
  /** The name of the view that is being transitioned to. Emitted by: `TRANSITION_VIEW`. See possible values at
   * https://plaid.com/docs/link/web/#link-web-onevent-metadata-view-name */
  readonly view_name: string | null;
  /** The request ID for the last request made by Link. This can be shared with Plaid Support to expedite investigation.
   * Emitted by: all events. */
  readonly request_id: string;
  /** The link_session_id is a unique identifier for a single session of Link. It's always available and will stay constant
   * throughout the flow. Emitted by: all events. */
  readonly link_session_id: string;
  /** An ISO 8601 representation of when the event occurred. For example `2017-09-14T14:42:19.350Z`. Emitted by: all events. */
  readonly timestamp: string;
  /** Either the verification method for a matched institution selected by the user or the Auth Type Select flow type
   * selected by the user. If selection is used to describe selected verification method, then possible values are
   * `phoneotp` or `password`;  if selection is used to describe the selected Auth Type Select flow, then possible values
   * are `flow_type_manual` or `flow_type_instant`. Emitted by: `MATCHED_SELECT_VERIFY_METHOD` and `SELECT_AUTH_TYPE`. */
  readonly selection: string | null;
}

// The following event names are stable and will not be deprecated or changed
export type PlaidLinkStableEvent =
  | "OPEN"
  | "EXIT"
  | "HANDOFF"
  | "SELECT_INSTITUTION"
  | "ERROR"
  | "BANK_INCOME_INSIGHTS_COMPLETED"
  | "IDENTITY_VERIFICATION_PASS_SESSION"
  | "IDENTITY_VERIFICATION_FAIL_SESSION";

export type PlaidCreateLinkToken = {
  /** Must be supplied to Link in order to initialize it and receive a public_token, which can be exchanged for an access_token. */
  readonly link_token: string;
  /** The expiration date for the link_token in ISO 8601 format */
  readonly expiration: string;
  /** A unique identifier for the request, which can be used for troubleshooting. This identifier, like all Plaid identifiers, is case sensitive. */
  readonly request_id?: string;
};

export type PlaidLinkOnEvent = (
  // see possible values for eventName at
  // https://plaid.com/docs/link/web/#link-web-onevent-eventName.
  // Events other than stable events are informational and subject to change,
  // and therefore should not be used to customize your product experience.
  eventName: PlaidLinkStableEvent | string,
  metadata: PlaidLinkOnEventMetadata,
) => void;

export type PlaidCallbacks = {
  /** A function that is called when a user successfully links an Item. */
  readonly onSuccess: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  /** A function that is called when a user exits Link without successfully linking an Item, or when an error occurs
   * during Link initialization. */
  readonly onExit?: (error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => void;
  /** A function that is called when a user reaches certain points in the Link flow. See possible values for `eventName`
   * at https://plaid.com/docs/link/web/#link-web-onevent-eventName. Events other than stable events are informational and
   * subject to change and therefore should not be used to customize your product experience. */
  readonly onEvent?: (eventName: PlaidLinkStableEvent | string, metadata: PlaidLinkOnEventMetadata) => void;
  /** A function that is called when the Link module has finished loading. Calls to plaidLinkHandler.open() prior to the
   * `onLoad` callback will be delayed until the module is fully loaded. */
  readonly onLoad?: () => void;
};

export type CreatePlaidLinkConfig = PlaidCallbacks & {
  /** Fetcher to retrieve the `link_token` required to initialize Plaid Link. The server supporting your app should
   * create a link_token using the Plaid `/link/token/create` endpoint. See https://plaid.com/docs/api/link/#linktokencreate
   * for more details. */
  readonly fetchToken: () => Promise<PlaidCreateLinkToken>;
  /** required on the second-initialization of link when using Link with a `redirect_uri` to support OAuth flows. */
  readonly receivedRedirectUri?: string;
};

export type PlaidHandlerSubmissionData = {
  readonly phone_number: string | null;
};

type ExitOptions = {
  /** If `true`, Link will exit immediately. Otherwise an exit confirmation screen may be presented to the user. */
  readonly force?: boolean;
};

export type PlaidHandler = {
  /** Display the Consent Pane view to your user, starting the Link flow.
   * Once open is called, you will begin receiving events via the `onEvent` callback. */
  readonly open: () => void;
  readonly submit: (data: PlaidHandlerSubmissionData) => void;
  /** Programmatically close Link. Calling this will trigger either the `onExit` or `onSuccess` callbacks. */
  readonly exit: (opts?: ExitOptions) => void;
  /** Destroy the Link handler instance, properly removing any DOM artifacts that were created by it. */
  readonly destroy: () => void;
};

export type PlaidLinkHandler = Omit<PlaidHandler, "destroy">;

export type PlaidEmbeddedHandler = {
  readonly destroy: () => void;
};

type PlaidCreateConfig = PlaidCallbacks & {
  // Provide a link_token associated with your account. Create one
  // using the /link/token/create endpoint.
  readonly token?: string | null;
  /** required on the second-initialization of link when using Link with a `redirect_uri` to support OAuth flows. */
  readonly receivedRedirectUri?: string;
};

export type Plaid = {
  create: (config: PlaidCreateConfig) => PlaidHandler;
  createEmbedded: (config: PlaidCreateConfig, domTarget: HTMLElement) => PlaidEmbeddedHandler;
};

declare global {
  interface Window {
    Plaid: Plaid;
  }
}
