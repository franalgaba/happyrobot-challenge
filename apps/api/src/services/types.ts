import type {
  FinalizeCallRequest,
  FinalizeCallResponse,
  CallRecord,
  LoadRecord,
  NegotiateOfferRequest,
  NegotiateOfferResponse,
  NegotiationRecord,
  ReportSummary,
  SearchLoadsRequest,
  SearchLoadsResponse,
  VerifyCarrierRequest,
  VerifyCarrierResponse,
  VoiceTokenRequest,
} from "@happyrobot-challenge/shared";

export interface CarrierService {
  verifyCarrier(input: VerifyCarrierRequest): Promise<VerifyCarrierResponse>;
}

export interface LoadService {
  searchLoads(input: SearchLoadsRequest): Promise<SearchLoadsResponse>;
}

export interface NegotiationService {
  negotiateOffer(input: NegotiateOfferRequest): Promise<NegotiateOfferResponse>;
}

export interface CallService {
  finalizeCall(input: FinalizeCallRequest): Promise<FinalizeCallResponse>;
}

export interface ReportService {
  getSummary(): Promise<ReportSummary>;
  listCalls(): Promise<CallRecord[]>;
  listLoads(): Promise<LoadRecord[]>;
  listNegotiations(): Promise<NegotiationRecord[]>;
}

export interface VoiceService {
  createToken(input: VoiceTokenRequest): Promise<unknown>;
}

export interface AppServices {
  carriers: CarrierService;
  loads: LoadService;
  negotiations: NegotiationService;
  calls: CallService;
  reports: ReportService;
  voice: VoiceService;
}
