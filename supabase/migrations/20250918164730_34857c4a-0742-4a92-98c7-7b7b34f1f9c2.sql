-- Create the trigger to call the function when course_orders payment_status changes to completed
CREATE TRIGGER course_order_completion_trigger
  AFTER UPDATE ON public.course_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_account_for_course_order();