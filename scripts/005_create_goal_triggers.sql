-- Create automatic goal progress update triggers
-- This script creates triggers to automatically update goal progress based on transactions

-- Function to update goal progress based on transactions
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    category_sum NUMERIC(15, 2);
BEGIN
    -- Update goals for the affected user
    FOR goal_record IN
        SELECT id, name, target_amount, category
        FROM public.goals
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND is_completed = false
    LOOP
        -- Calculate total saved for this goal category
        -- This is a simplified approach - in practice you might want more sophisticated logic

        IF goal_record.category = 'savings' THEN
            -- For savings goals, sum all income minus expenses
            SELECT COALESCE(
                (SELECT SUM(amount) FROM public.transactions
                 WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
                 AND type = 'income') -
                (SELECT SUM(amount) FROM public.transactions
                 WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
                 AND type = 'expense'),
                0
            ) INTO category_sum;

            -- Ensure it's not negative
            category_sum := GREATEST(category_sum, 0);

        ELSIF goal_record.category = 'investment' THEN
            -- For investment goals, sum transactions to investment accounts
            SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
            FROM public.transactions t
            JOIN public.accounts a ON t.account_id = a.id
            WHERE t.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND a.type = 'investment'
            AND t.type = 'income';

        ELSE
            -- For other categories, sum positive transactions in that category
            SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
            FROM public.transactions t
            JOIN public.categories c ON t.category_id = c.id
            WHERE t.user_id = COALESCE(NEW.user_id, OLD.user_id)
            AND c.name ILIKE '%' || goal_record.category || '%'
            AND t.type = 'income';
        END IF;

        -- Update the goal's current amount
        UPDATE public.goals
        SET
            current_amount = LEAST(category_sum, target_amount),
            is_completed = (category_sum >= target_amount),
            updated_at = NOW()
        WHERE id = goal_record.id;

    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT transactions
CREATE OR REPLACE TRIGGER trigger_update_goals_on_transaction_insert
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Create trigger for UPDATE transactions
CREATE OR REPLACE TRIGGER trigger_update_goals_on_transaction_update
    AFTER UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Create trigger for DELETE transactions
CREATE OR REPLACE TRIGGER trigger_update_goals_on_transaction_delete
    AFTER DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Create function to manually update all goals for a user
CREATE OR REPLACE FUNCTION recalculate_user_goals(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    goal_record RECORD;
    category_sum NUMERIC(15, 2);
BEGIN
    FOR goal_record IN
        SELECT id, name, target_amount, category
        FROM public.goals
        WHERE user_id = target_user_id
        AND is_completed = false
    LOOP
        IF goal_record.category = 'savings' THEN
            SELECT COALESCE(
                (SELECT SUM(amount) FROM public.transactions
                 WHERE user_id = target_user_id
                 AND type = 'income') -
                (SELECT SUM(amount) FROM public.transactions
                 WHERE user_id = target_user_id
                 AND type = 'expense'),
                0
            ) INTO category_sum;

            category_sum := GREATEST(category_sum, 0);

        ELSIF goal_record.category = 'investment' THEN
            SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
            FROM public.transactions t
            JOIN public.accounts a ON t.account_id = a.id
            WHERE t.user_id = target_user_id
            AND a.type = 'investment'
            AND t.type = 'income';

        ELSE
            SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
            FROM public.transactions t
            JOIN public.categories c ON t.category_id = c.id
            WHERE t.user_id = target_user_id
            AND c.name ILIKE '%' || goal_record.category || '%'
            AND t.type = 'income';
        END IF;

        UPDATE public.goals
        SET
            current_amount = LEAST(category_sum, target_amount),
            is_completed = (category_sum >= target_amount),
            updated_at = NOW()
        WHERE id = goal_record.id;

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to update specific goal progress
CREATE OR REPLACE FUNCTION update_specific_goal_progress(goal_id UUID)
RETURNS VOID AS $$
DECLARE
    goal_record RECORD;
    category_sum NUMERIC(15, 2);
    goal_user_id UUID;
BEGIN
    -- Get goal details
    SELECT id, user_id, name, target_amount, category
    INTO goal_record
    FROM public.goals
    WHERE id = goal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Goal not found';
    END IF;

    goal_user_id := goal_record.user_id;

    -- Calculate progress based on category
    IF goal_record.category = 'savings' THEN
        SELECT COALESCE(
            (SELECT SUM(amount) FROM public.transactions
             WHERE user_id = goal_user_id
             AND type = 'income') -
            (SELECT SUM(amount) FROM public.transactions
             WHERE user_id = goal_user_id
             AND type = 'expense'),
            0
        ) INTO category_sum;

        category_sum := GREATEST(category_sum, 0);

    ELSIF goal_record.category = 'investment' THEN
        SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
        FROM public.transactions t
        JOIN public.accounts a ON t.account_id = a.id
        WHERE t.user_id = goal_user_id
        AND a.type = 'investment'
        AND t.type = 'income';

    ELSE
        SELECT COALESCE(SUM(t.amount), 0) INTO category_sum
        FROM public.transactions t
        JOIN public.categories c ON t.category_id = c.id
        WHERE t.user_id = goal_user_id
        AND c.name ILIKE '%' || goal_record.category || '%'
        AND t.type = 'income';
    END IF;

    -- Update the goal
    UPDATE public.goals
    SET
        current_amount = LEAST(category_sum, goal_record.target_amount),
        is_completed = (category_sum >= goal_record.target_amount),
        updated_at = NOW()
    WHERE id = goal_id;
END;
$$ LANGUAGE plpgsql;