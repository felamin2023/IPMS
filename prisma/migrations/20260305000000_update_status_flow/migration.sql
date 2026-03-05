-- Add new enum values to RequestStatus
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'head_review';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'budget_review';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'procurement_processing';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'purchase_order';
