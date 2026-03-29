-- Remove po_received_supply from RequestStatus enum

DROP TYPE IF EXISTS "RequestStatus_old";
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";

CREATE TYPE "RequestStatus" AS ENUM (
  'draft',
  'request_sent',
  'request_reviewed',
  'pr_number_assigned',
  'notice_of_meeting',
  'endorsed_to_bac',
  'resolution_approved',
  'under_supplier_quotation',
  'quotations_received',
  'under_quotation_evaluation',
  'hope_approval',
  'abstract_prepared',
  'contract_awarded',
  'po_issued',
  'ntp_issued',
  'noa_po_ntp_posted',
  'po_delivered',
  'items_for_inspection',
  'under_inspection',
  'under_warehousing',
  'issuance',
  'completed',
  'returned_for_revision',
  'returned_for_action'
);

ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "requests"
  ALTER COLUMN "status" TYPE "RequestStatus"
  USING "status"::text::"RequestStatus";

ALTER TABLE "requests"
  ALTER COLUMN "status" SET DEFAULT 'request_sent';

DROP TYPE "RequestStatus_old";
