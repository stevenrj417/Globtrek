update public.hotel_catalog
set
  image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Shangri_La_hotel_and_residences%2C_Vancouver.jpg/1920px-Shangri_La_hotel_and_residences%2C_Vancouver.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  image_source = 'Wikimedia Commons',
  image_license_metadata = '{"author":"Darren Kirby","licenseName":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","sourcePageUrl":"https://commons.wikimedia.org/wiki/File:Shangri_La_hotel_and_residences,_Vancouver.jpg","attributionText":"Photo by Darren Kirby, CC BY-SA 3.0"}'::jsonb,
  updated_at = now()
where destination_id = 'YVR'
  and normalized_name = 'shangri la vancouver'
  and provider = 'booking_com_cj';
