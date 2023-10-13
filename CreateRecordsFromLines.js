/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log'], function (record, log) {

    function createRequisitionApproval(item, quantity, memo, estimatedRate, currency, estimatedAmount, PROGRAMME, RecordId) {
        // Create a new Requisition Approval with line items
        var RequisitionApproval = record.create({
            type: 'customrecord_se4all_requisition_approval' 
        });

        // Set field values based on the provided values from the line items of Requisition
        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_',
            value: item
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_quantity',
            value: quantity
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_memo',
            value: memo
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_approval_statuts',
            value: 1
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_estimated_rate',
            value: estimatedRate
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_currency',
            value: currency
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_estimated_amount',
            value: estimatedAmount
        });

        RequisitionApproval.setValue({
            fieldId: 'cseg_npo_fund_p',
            value: PROGRAMME
        });

        RequisitionApproval.setValue({
            fieldId: 'custrecord_se4all_parent',
            value: RecordId
        });

        // Save the RequisitionApproval
        var RequisitionApprovalId = RequisitionApproval.save();

        // Log the ID of the newly created CustomRecordB
        log.debug('Requisition Approval Created', 'Record ID: ' + RequisitionApprovalId);

        return RequisitionApprovalId;
    }

    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE) {
                // Get the current Requisition record being created
                var newRecord = context.newRecord;

                // Get the current Requisition ID
                var RecordId = newRecord.id

                var loadRequisition = record.load({
                    type: "purchaserequisition",
                    id: RecordId,
                    isDynamic: false
                });


                // Retrieve line item data from the Requisition record
                var lineCount = newRecord.getLineCount({ sublistId: 'item' });

                // Retrieve body fields needed
                var memo = newRecord.getValue({fieldId:'memo'})
                var currency = newRecord.getValue({fieldId:'currency'})

                for (var i = 0; i < lineCount; i++) {
                    // Retrieve line item details
                    var item = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var quantity = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var estimatedRate = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'estimatedrate', line: i });
                    var estimatedAmount = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'estimatedamount', line: i });
                    var PROGRAMME = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'cseg_npo_fund_p', line: i });

                    
                    log.debug('RecordId', RecordId);

                    // Create a new record from line item details 
                    var approveId = createRequisitionApproval(item, quantity, memo, estimatedRate, currency, estimatedAmount, PROGRAMME, RecordId);

                    // Set the approve Id (created record ID) for the sublist
                    loadRequisition.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_se4all_approval_id",
                        line: i,
                        value: approveId
                      });

                    // Set the Status to pending when created 
                    loadRequisition.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_se4all_line_status",
                        line: i,
                        value: 1
                      });
                }

                loadRequisition.save();
            }
        } catch (e) {
            log.error('Error', e.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
