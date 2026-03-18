ALTER TABLE "request_messages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read request messages"
ON "request_messages";

DROP POLICY IF EXISTS "Allowed participants can insert request messages"
ON "request_messages";

CREATE POLICY "Authenticated users can read request messages"
ON "request_messages"
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allowed participants can insert request messages"
ON "request_messages"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "sender_id"
  AND EXISTS (
    SELECT 1
    FROM "requests" r
    JOIN "users" u ON u."id" = auth.uid()::text
    WHERE r."id" = "request_messages"."request_id"
      AND (
        r."created_by" = auth.uid()::text
        OR (
          r."status" NOT IN (
            'completed',
            'returned_for_revision',
            'returned_for_action',
            'issuance'
          )
          AND (
            (r."status" = 'request_sent' AND u."role" = 'twg')
            OR (
              r."status" IN (
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
                'ntp_issued'
              )
              AND u."role" = 'procurement_admin'
            )
            OR (
              r."status" IN (
                'noa_po_ntp_posted',
                'po_delivered',
                'po_received_supply',
                'items_for_inspection',
                'under_inspection',
                'under_warehousing'
              )
              AND u."role" = 'supply_admin'
            )
          )
        )
      )
  )
);
