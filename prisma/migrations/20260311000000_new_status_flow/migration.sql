-- Add new UserRole values
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'twg';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'procurement_admin';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'supply_admin';

-- Add new RequestStatus values
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'request_sent';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'request_reviewed';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'pr_number_assigned';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'notice_of_meeting';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'endorsed_to_bac';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'resolution_approved';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'under_supplier_quotation';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'quotations_received';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'under_quotation_evaluation';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'hope_approval';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'abstract_prepared';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'contract_awarded';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'po_issued';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'ntp_issued';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'noa_po_ntp_posted';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'po_delivered';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'po_received_supply';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'items_for_inspection';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'under_inspection';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'under_warehousing';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'returned_for_revision';
