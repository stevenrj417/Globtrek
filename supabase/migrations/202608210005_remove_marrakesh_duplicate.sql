-- Keep the legacy RAK/MARRAKECH record because existing verified hotels reference it.
-- The normalized Marrakesh row is the orphaned spelling duplicate replaced by Wadi Musa.
delete from public.travel_destinations
where id = 'marrakesh-32e08'
  and city = 'Marrakesh'
  and country = 'Morocco'
  and not exists (
    select 1
    from public.hotel_catalog
    where destination_id = 'marrakesh-32e08'
  );
