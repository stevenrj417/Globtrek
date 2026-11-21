-- Allow the Luxury level in saved "any place" picks.
alter table public.place_picks drop constraint if exists place_picks_budget_check;
alter table public.place_picks add constraint place_picks_budget_check check (budget in ('budget', 'mid', 'comfort', 'luxury'));
