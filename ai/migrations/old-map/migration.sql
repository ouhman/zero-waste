-- Zero Waste Frankfurt: Migration from Google Maps
-- Generated: 2026-01-09T21:08:51.852Z
-- Total locations: 270

-- NOTE: Run this after seeding categories

DO $$
DECLARE
  loc_id uuid;
  cat_unverpackt_id uuid;
  cat_gastronomie_id uuid;
  cat_baeckereien_id uuid;
  cat_feinkost_id uuid;
  cat_milchtankstellen_id uuid;
  cat_bio_regional_id uuid;
  cat_haushalt_pflege_id uuid;
  cat_wochenmaerkte_id uuid;
  cat_flohmaerkte_id uuid;
  cat_second_hand_id uuid;
  cat_nachhaltige_mode_id uuid;
  cat_andere_id uuid;
  cat_repair_cafes_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_unverpackt_id FROM categories WHERE slug = 'unverpackt';
  SELECT id INTO cat_gastronomie_id FROM categories WHERE slug = 'gastronomie';
  SELECT id INTO cat_baeckereien_id FROM categories WHERE slug = 'baeckereien';
  SELECT id INTO cat_feinkost_id FROM categories WHERE slug = 'feinkost';
  SELECT id INTO cat_milchtankstellen_id FROM categories WHERE slug = 'milchtankstellen';
  SELECT id INTO cat_bio_regional_id FROM categories WHERE slug = 'bio-regional';
  SELECT id INTO cat_haushalt_pflege_id FROM categories WHERE slug = 'haushalt-pflege';
  SELECT id INTO cat_wochenmaerkte_id FROM categories WHERE slug = 'wochenmaerkte';
  SELECT id INTO cat_flohmaerkte_id FROM categories WHERE slug = 'flohmaerkte';
  SELECT id INTO cat_second_hand_id FROM categories WHERE slug = 'second-hand';
  SELECT id INTO cat_nachhaltige_mode_id FROM categories WHERE slug = 'nachhaltige-mode';
  SELECT id INTO cat_andere_id FROM categories WHERE slug = 'andere';
  SELECT id INTO cat_repair_cafes_id FROM categories WHERE slug = 'repair-cafes';

  -- Location 1: Die Auffüllerei
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Die Auffüllerei',
    'In diesem Unverpackt-Laden in Frankfurt-Bornheim findest du fast alles, was das Herz begehrt. Was es nicht gibt, darfst du auf die Wunschliste schreiben. Mehr Infos dazu: https://www.zerowastefrankfurt.de/die-auffuellerei-in-bornheim-unverpackt-laden-nr-3/',
    'Höhenstraße 40',
    'Frankfurt am Main',
    '60385',
    50.1245912,
    8.70008859999996,
    'https://dieauffuellerei.de/',
    '+49 69 40564006',
    'Hallo@dieauffuellerei.de',
    NULL,
    'Di-Fr 11:00-19:00,  Sa 11:00-16:00,  So closed,  Feiertage geschlossen',
    'Tu-Fr 11:00-19:00; Sa 11:00-16:00; Su closed; PH closed',
    '{"cash":true,"credit_cards":true,"debit_cards":true}'::jsonb,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 2: franco Unverpackt Laden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'franco Unverpackt Laden',
    '',
    'Eschersheimer Landstraße 47',
    'Frankfurt am Main',
    '60322',
    50.1213844,
    8.6751198,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 3: Höchst Unverpackt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Höchst Unverpackt',
    '',
    'Antoniterstraße',
    'Frankfurt am Main',
    '65929',
    50.0991412,
    8.5455944,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 4: Ulf - un:verpackt Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Ulf - un:verpackt Sachsenhausen',
    '',
    'Darmstädter Landstraße 44',
    'Frankfurt am Main',
    '60594',
    50.10232,
    8.69042,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 5: ADAM FAIRkaufen | Aschaffenburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'ADAM FAIRkaufen | Aschaffenburg',
    '',
    'Danziger Straße',
    'Aschaffenburg',
    '63739',
    49.9782784,
    9.1552499,
    'https://adam-fairkaufen.de',
    NULL,
    NULL,
    NULL,
    'Mo-Fr 08:30-18:00, Sa 08:30-14:00, Feiertage geschlossen',
    'Mo-Fr 08:30-18:00;Sa 08:30-14:00;PH off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 6: BIO-unverpackt | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'BIO-unverpackt | Wiesbaden',
    '',
    'Dotzheimer Straße 19',
    'Wiesbaden',
    '65185',
    50.0788381,
    8.2339336,
    'https://www.bio-unverpackt.com/',
    '+49 611 44762306',
    'info@Bio-unverpackt.de',
    NULL,
    'Di 11:00-18:00,Do-Fr 11:00-18:00,Sa 10:00-14:00,  Feiertage geschlossen',
    'Tu 11:00-18:00,Th-Fr 11:00-18:00,Sa 10:00-14:00; PH off',
    '{"cash":true,"credit_cards":true,"debit_cards":true,"maestro":true,"visa":true,"mastercard":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 7: chez Martine | Hammelbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'chez Martine | Hammelbach',
    '',
    'Schulstraße 6',
    'Hammelbach',
    '64689',
    49.6351888,
    8.831685,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 8: EINKORN | Viernheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'EINKORN | Viernheim',
    '',
    'Rathausstraße 41',
    'Viernheim',
    '68519',
    49.5374121,
    8.57869,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 9: Emmas Erben | Otzberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Emmas Erben | Otzberg',
    '',
    'Schloßgasse',
    'Habitzheim',
    '64853',
    49.8505301,
    8.879234,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 10: Honighalle | Friedrichsdorf
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Honighalle | Friedrichsdorf',
    '',
    'Köpperner Straße 82-84',
    'Friedrichsdorf',
    '61381',
    50.2694973,
    8.6481468,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 08:30-19:00',
    'Mo-Sa 08:30-19:00',
    NULL,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 11: Mittendrin | Gelnhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Mittendrin | Gelnhausen',
    '',
    'Bahnhofstraße 17',
    'Gelnhausen',
    '63571',
    50.197698,
    9.19042899999999,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 12: Mittendrin | Hanau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Mittendrin | Hanau',
    '',
    'Römerstraße 1',
    'Hanau',
    '63450',
    50.1322846,
    8.91599339999993,
    'https://www.mittendrin-hanau.de/',
    '+49 6181 4901400',
    NULL,
    NULL,
    'Mo 10:00-18:00,  Di 10:00-18:00,  Mi 08:00-18:00,  Do 09:00-18:00,  Fr 10:00-18:00,  Sa 08:00-15:00',
    'Mo 10:00-18:00; Tu 10:00-18:00; We 08:00-18:00; Th 09:00-18:00; Fr 10:00-18:00; Sa 08:00-15:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 13: Nix-Drum-Rum | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Nix-Drum-Rum | Bad Nauheim',
    '',
    'Marktplatz 9',
    'Bad Nauheim',
    '61231',
    50.3637339,
    8.73509539999998,
    'https://nix-drum-rum.de/',
    '+49 6032 8675475',
    NULL,
    NULL,
    'Mo,Do-Fr 09:30-18:00,  Mi 09:30-18:00,  Sa 09:30-14:00',
    'Mo,Th-Fr 09:30-18:00; We 09:30-18:00; Sa 09:30-14:00',
    NULL,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 14: OF Unverpackt | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'OF Unverpackt | Offenbach',
    '',
    'Gabelsbergerstraße 48',
    'Offenbach am Main',
    '63069',
    50.094802,
    8.762807,
    NULL,
    NULL,
    NULL,
    NULL,
    'Di-Fr 10:00-19:00, Sa 10:00-18:00',
    'Tu-Fr 10:00-19:00, Sa 10:00-18:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 15: Steffis unverpackt | Mönchberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Steffis unverpackt | Mönchberg',
    '',
    'Hauptstraße 49',
    'Mönchberg',
    '63933',
    49.7925202,
    9.2670418,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 16: Take it easy | Alzenau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Take it easy | Alzenau',
    '',
    'Hanauer Straße 23',
    'Alzenau',
    '63755',
    50.0868796,
    9.0712433,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 17: Tante Erna Unverpackt | Mörfelden-Walldorf
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tante Erna Unverpackt | Mörfelden-Walldorf',
    '',
    'Schulgasse 3',
    'Mörfelden',
    '64546',
    49.974975,
    8.5695809,
    'https://tante-erna.de/',
    '+49 6105 278485',
    'info@tante-erna.de',
    NULL,
    'Do-Fr 10:00-12:30,  Do-Fr 14:30-19:00,  Sa 09:00-13:00',
    'Th-Fr 10:00-12:30; Th-Fr 14:30-19:00; Sa 09:00-13:00',
    '{"cash":true,"credit_cards":true}'::jsonb,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 18: Unverpackt Darmstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Unverpackt Darmstadt',
    '',
    'Gutenbergstraße 5b',
    'Darmstadt',
    '64289',
    49.8723196,
    8.6527854,
    'https://www.unverpacktdarmstadt.com/',
    '+49 178 281 55 98',
    NULL,
    NULL,
    'Mo-Fr 10:00-19:00,  Sa 10:00-14:00',
    'Mo-Fr 10:00-19:00; Sa 10:00-14:00',
    '{"cash":true,"debit_cards":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 19: Unverpackt Mainz
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Unverpackt Mainz',
    'Mehr als 400 Produkte, überwiegend in Bio-Qualität. Es gibt trockene Lebensmittel, Kosmetik- und Haushaltsprodukte zum selbst Abfüllen sowie Milchprodukte, Eier und Aufstriche im Glas. Mehr Infos dazu: https://www.instagram.com/p/Bv4ltayHQ-K/',
    'Heidelbergerfaßgasse 16a',
    'Mainz',
    '55116',
    50.0036362,
    8.264401,
    'https://unverpackt-mainz.de/',
    '+49 6131 6356783',
    'info@unverpackt-mainz.de',
    NULL,
    'Mo-Fr 10:00-19:00,  Sa 10:00-16:00',
    'Mo-Fr 10:00-19:00; Sa 10:00-16:00',
    '{"cash":true,"maestro":true}'::jsonb,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 20: Unverpacktes Gießen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Unverpacktes Gießen',
    '',
    'Johannette-Lein-Gasse 24',
    'Gießen',
    '35390',
    50.5857467,
    8.67045929999995,
    'https://www.unverpacktes-giessen.de',
    NULL,
    NULL,
    NULL,
    'Mo-Fr 10:00-19:00,  Sa 10:00-18:00,  Feiertage geschlossen',
    'Mo-Fr 10:00-19:00; Sa 10:00-18:00; PH off',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_unverpackt_id);

  -- Location 21: Africa Queen Restaurant
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Africa Queen Restaurant',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Schloßstraße 113',
    'Frankfurt am Main',
    '60486',
    50.1171057,
    8.6461513,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-So,PH 12:00-23:00',
    'Mo-Su,PH 12:00-23:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 22: Baders Fisch Deli
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Baders Fisch Deli',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße',
    'Frankfurt am Main',
    '60487',
    50.1228175,
    8.6447834,
    NULL,
    '+49 69 775040',
    NULL,
    NULL,
    'Mo-Fr 10:30-17:00,  Sa 10:30-14:00',
    'Mo-Fr 10:30-17:00; Sa 10:30-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 23: Bulli Burrito
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bulli Burrito',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße 36',
    'Frankfurt am Main',
    '60487',
    50.1218958,
    8.6474533,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 24: Café Ana
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Café Ana',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Mittelweg 47',
    'Frankfurt am Main',
    '60318',
    50.1210232,
    8.6808014,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 25: Café Billabong
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Café Billabong',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Graf-von-Stauffenberg-Allee 44',
    'Frankfurt am Main',
    '60438',
    50.1801667,
    8.618355,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 26: Café Menthe
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Café Menthe',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Dortelweiler Straße 87',
    'Frankfurt am Main',
    '60389',
    50.1359325,
    8.7018944,
    NULL,
    NULL,
    NULL,
    NULL,
    '09:00-18:00',
    '09:00-18:00',
    NULL,
    '{"wheelchair":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 27: Die Brücke
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Die Brücke',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Brückenstraße 19',
    'Frankfurt am Main',
    '60594',
    50.1056598,
    8.6876532,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 28: Fridas Cafe
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Fridas Cafe',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße 108',
    'Frankfurt am Main',
    '60487',
    50.1239378,
    8.6411615,
    'https://fridas-cafe.de/',
    '+49 69 27273023',
    NULL,
    NULL,
    'Mar So[-1]-Oct So[-1] -1 day: Mo-Sa 09:00-22:00,  So,PH 10:00-21:00,  Oct So[-1]-Mar So[-1] -1 day: Mo-Sa 09:00-20:00,  So,PH 10:00-19:00',
    'Mar Su[-1]-Oct Su[-1] -1 day: Mo-Sa 09:00-22:00; Su,PH 10:00-21:00; Oct Su[-1]-Mar Su[-1] -1 day: Mo-Sa 09:00-20:00; Su,PH 10:00-19:00',
    NULL,
    '{"wifi":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 29: Füny’s Café
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Füny’s Café',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße 106',
    'Frankfurt am Main',
    '60487',
    50.123636,
    8.6414106,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-So,PH 09:00-20:00',
    'Mo-Su,PH 09:00-20:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 30: Glauburg Café
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Glauburg Café',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Glauburgstraße 28',
    'Frankfurt am Main',
    '60318',
    50.12705,
    8.688177,
    'https://www.glauburg-cafe.de/',
    NULL,
    NULL,
    NULL,
    'Mo-So 09:00-17:00',
    'Mo-Su 09:00-17:00',
    NULL,
    '{"wifi":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 31: Kaffeemacherei
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Kaffeemacherei',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Bornwiesenweg 4',
    'Frankfurt am Main',
    '60322',
    50.1217017,
    8.6796317,
    'http://www.die-kaffeemacherei.de',
    NULL,
    NULL,
    NULL,
    'Mi-So 10:00-18:00',
    'We-Su 10:00-18:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 32: Karrys & Barrys
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Karrys & Barrys',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Alfred-Wegener-Straße',
    'Frankfurt am Main',
    '60439',
    50.1761103,
    8.6297503,
    'https://karrysandbarrys.de/',
    '+49 69 26940412',
    NULL,
    NULL,
    'Mo-Do 10:00-17:00,  Fr-So 10:00-18:00',
    'Mo-Th 10:00-17:00; Fr-Su 10:00-18:00',
    NULL,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 33: Minerva Restaurant / Bistro
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Minerva Restaurant / Bistro',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Max-von-Laue-Straße',
    'Frankfurt am Main',
    '60439',
    50.1743522,
    8.6298897,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 34: Onocubes
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Onocubes',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Eschersheimer Landstraße',
    'Frankfurt am Main',
    '60322',
    50.1230724,
    8.6759169,
    'https://www.onocubes.com',
    '+49 69 97764515',
    NULL,
    NULL,
    'Di-Fr 11:30-14:30,17:30-22:30,  Sa 17:30-22:30,  So 17:30-21:30',
    'Tu-Fr 11:30-14:30,17:30-22:30; Sa 17:30-22:30; Su 17:30-21:30',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 35: Pasta e Panini
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Pasta e Panini',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße',
    'Frankfurt am Main',
    '60487',
    50.1204388,
    8.6491505,
    'https://www.pastaepanini.de/',
    '+49 69 97698388',
    NULL,
    NULL,
    'Mo-Sa 09:30-22:30',
    'Mo-Sa 09:30-22:30',
    NULL,
    '{"wheelchair":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 36: Picknick Café Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Picknick Café Bornheim',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Spessartstraße 2',
    'Frankfurt am Main',
    '60385',
    50.1253702,
    8.7075458,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 37: Purple Açaí
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Purple Açaí',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Oeder Weg',
    'Frankfurt am Main',
    '60318',
    50.1223994,
    8.6807743,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 38: Restaurant Ponte
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Restaurant Ponte',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Am Weingarten 5',
    'Frankfurt am Main',
    '60487',
    50.1227475,
    8.6467792,
    'https://restaurant-ponte-frankfurt.de/',
    '+49 69 24704041',
    'info@restaurant-ponte-frankfurt.de',
    NULL,
    'Mo-Sa 18:00-22:30,  Mo-Fr 12:00-14:30',
    'Mo-Sa 18:00-22:30; Mo-Fr 12:00-14:30',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 39: Savory
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Savory',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Burgfriedenstraße 2',
    'Frankfurt am Main',
    '60489',
    50.1251867,
    8.6121735,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 40: Sushi Sensei
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Sushi Sensei',
    'Beschreibung: Frankfurts erster Sushi-Lieferservice, der in Mehrweg-Boxen beliefert. Mehr Infos dazu: https://www.instagram.com/p/Bvq0_2_HEWU/ name:',
    'Hansaallee 162',
    'Frankfurt am Main',
    '60320',
    50.1373841,
    8.6676234,
    'https://www.sushi-sensei.de',
    '+49 69 297 298 81',
    NULL,
    NULL,
    'Do,Fr 11:00-22:00,  Mi,Sa-Mo 16:00-22:00,  Di off',
    'Th,Fr 11:00-22:00; We,Sa-Mo 16:00-22:00; Tu off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 41: Tandoori Masala
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tandoori Masala',
    'Beschreibung: Dieser Imbiss bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Heddernheimer Landstraße 3',
    'Frankfurt am Main',
    '60439',
    50.1591551,
    8.6504914,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 42: Taverna Alpha
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Taverna Alpha',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Burgstraße 82',
    'Frankfurt am Main',
    '60389',
    50.1256999,
    8.7005414,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 43: Thai Art
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Thai Art',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Oeder Weg',
    'Frankfurt am Main',
    '60318',
    50.1223099,
    8.6806182,
    'http://thaiart.de/',
    '+49 69 90554820',
    NULL,
    NULL,
    'Mo 11:30-23:00,  Di-Sa 11:30-23:00,  So,PH 11:30-22:00',
    'Mo 11:30-23:00; Tu-Sa 11:30-23:00; Su,PH 11:30-22:00',
    NULL,
    '{"takeaway":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 44: Viet Pho Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Viet Pho Bockenheim',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Leipziger Straße 38',
    'Frankfurt am Main',
    '60487',
    50.1220329,
    8.6473636,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 45: Viet Pho Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Viet Pho Bornheim',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Berger Straße 213',
    'Frankfurt am Main',
    '60385',
    50.1269947,
    8.7086693,
    'https://www.vietpho.eu',
    '+49 69 96866822',
    'vietphoberger@yahoo.com',
    NULL,
    'Di-Fr 11:00-22:30,  Sa 11:00-23:00,  So,PH 12:00-22:00,  Mo off',
    'Tu-Fr 11:00-22:30; Sa 11:00-23:00; Su,PH 12:00-22:00; Mo off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 46: BioMarkt | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'BioMarkt | Bad Nauheim',
    'Beschreibung: Hier wird dein Coffee to go in den mitgebrachten Becher gefüllt. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Hubert-Vergölst-Straße 18',
    'Schwalheim',
    '61231',
    50.3606988,
    8.7533999,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:30-20:00',
    'Mo-Sa 07:30-20:00',
    '{"cash":true,"maestro":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 47: Café & Konditorei Müller | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Café & Konditorei Müller | Bad Nauheim',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Aliceplatz 6',
    'Bad Nauheim',
    '61231',
    50.36505,
    8.73791,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 48: Levante Café Bar | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Levante Café Bar | Bad Nauheim',
    'Beschreibung: Dieses Lokal bietet verpackungsfreies Take-Away an. Du kannst dein Essen in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". name:',
    'Karlstraße 5',
    'Bad Nauheim',
    '61231',
    50.3649701,
    8.7392636,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_gastronomie_id);

  -- Location 49: Bäckerei Huck Backstubenverkauf | Rödelheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck Backstubenverkauf | Rödelheim',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Alexanderstraße 51',
    'Frankfurt am Main',
    '60489',
    50.126924,
    8.611674,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 50: Bäckerei Huck | Altstadt, Kleinmarkthalle
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Altstadt, Kleinmarkthalle',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Hasengasse 5',
    'Frankfurt am Main',
    '60311',
    50.11292,
    8.68373,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 51: Bäckerei Huck | Bad Homburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Bad Homburg',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Louisenstraße 69',
    'Bad Homburg vor der Höhe',
    '61348',
    50.2265443,
    8.6170927,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 52: Bäckerei Huck | Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Bockenheim',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Adalbertstraße 1',
    'Frankfurt am Main',
    '60486',
    50.1200077,
    8.6497673,
    'https://www.huckgmbh.de',
    '+49 69 26013139',
    NULL,
    NULL,
    'Mo-Fr 06:30-19:00,  Sa,So,PH 07:00-14:00',
    'Mo-Fr 06:30-19:00; Sa,Su,PH 07:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 53: Bäckerei Huck | Flughafen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Flughafen',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Ankunftbogen',
    'Frankfurt am Main',
    '60549',
    50.0509344,
    8.572016,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 54: Bäckerei Huck | Ginnheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Ginnheim',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Hügelstraße 190',
    'Frankfurt am Main',
    '60431',
    50.1465595,
    8.658809,
    'https://www.baeckerei-huck.de/',
    '+49 69 75844447',
    NULL,
    NULL,
    'Mo-Fr 06:30-19:00,  Sa,So,PH 07:00-14:00',
    'Mo-Fr 06:30-19:00; Sa,Su,PH 07:00-14:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 55: Bäckerei Huck | Höchst
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Höchst',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Adelonstraße 27',
    'Frankfurt am Main',
    '65929',
    50.1033959,
    8.5419321,
    NULL,
    '+49 69 30039142',
    NULL,
    NULL,
    'Mo-Fr 06:30-19:00,  Sa-So,PH 07:00-14:00',
    'Mo-Fr 06:30-19:00; Sa-Su,PH 07:00-14:00',
    NULL,
    '{"wheelchair":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 56: Bäckerei Huck | Nordend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Nordend',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Eckenheimer Landstraße 45',
    'Frankfurt am Main',
    '60318',
    50.1360535,
    8.6839833,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 06:30-19:00,  Sa,So,PH 07:00-14:00',
    'Mo-Fr 06:30-19:00; Sa,Su,PH 07:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 57: Bäckerei Huck | Ostend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Ostend',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Sonnemannstraße 81',
    'Frankfurt am Main',
    '60314',
    50.11137,
    8.70404,
    'https://www.baeckerei-huck.de',
    '+49 69 97766930',
    NULL,
    NULL,
    'Sa,So,PH 07:00-12:00',
    'Sa,Su,PH 07:00-12:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 58: Bäckerei Huck | Rödelheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Rödelheim',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Thudichumstraße 24',
    'Frankfurt am Main',
    '60489',
    50.1269948,
    8.6135732,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 06:30-20:00,  So 07:00-17:00,  PH 07:00-17:00',
    'Mo-Sa 06:30-20:00; Su 07:00-17:00; PH 07:00-17:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 59: Bäckerei Huck | Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Sachsenhausen',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Schweizer Straße 30',
    'Frankfurt am Main',
    '60594',
    50.1033707,
    8.6792845,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 60: Bäckerei Huck | Westend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bäckerei Huck | Westend',
    'Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Grüneburgweg 3',
    'Frankfurt am Main',
    '60322',
    50.120721,
    8.675293,
    'https://www.huckgmbh.de',
    '+49 69 59796770',
    NULL,
    NULL,
    'Mo-Fr 06:30-19:00,  Sa,So,PH 07:00-14:00',
    'Mo-Fr 06:30-19:00; Sa,Su,PH 07:00-14:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 61: Yesternday by Huck | Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Yesternday by Huck | Bockenheim',
    'Im Yesternday by Huck erhälst du Backwaren vom Vortag zum halben Preis. Die Erlöse werden an wohltätige Zwecke gespendet. Diese Bäckerei bietet verpackungsfreies Einkaufen an. Du kannst deine Backwaren in deine mitgebrachten Beutel und Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte". Alle Standorte der Bäckerei Huck, unter anderem auch Stände auf Wochenmärkten, findest du hier: www.baeckerei-huck.de/standorte/',
    'Landgrafenstraße 1',
    'Frankfurt am Main',
    '60486',
    50.1212771,
    8.6479342,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_baeckereien_id);

  -- Location 62: Bizziice Eisdiele Nordend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bizziice Eisdiele Nordend',
    'Bio-Eis aus feinsten Zutaten, dazu hausgemachten Kuchen und Kaffeespezialitäten. Eigene Behälter für Kaffee und Eis (auch für die 1 Liter-Portion) werden gerne akzeptiert. Mehr Infos dazu: https://www.instagram.com/p/B4IsKhVIOJ6/',
    'Koselstraße 42',
    'Frankfurt am Main',
    '60318',
    50.1232451,
    8.68809759999999,
    'https://bizzi-ice.com',
    '+496994942550',
    NULL,
    NULL,
    'May-Sep: Mo-So 11:00-22:00,  Oct-Apr: Mo-So 11:00-19:00',
    'May-Sep: Mo-Su 11:00-22:00; Oct-Apr: Mo-Su 11:00-19:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 63: Bizziice Eisdiele Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bizziice Eisdiele Sachsenhausen',
    'Bio-Eis aus feinsten Zutaten, dazu hausgemachten Kuchen und Kaffeespezialitäten. Eigene Behälter für Kaffee und Eis (auch für die 1 Liter-Portion) werden gerne akzeptiert. Mehr Infos dazu: https://www.instagram.com/p/B4IsKhVIOJ6/',
    'Wallstraße 26',
    'Frankfurt am Main',
    '60594',
    50.10539,
    8.68754999999999,
    'https://www.bizzi-ice.com/',
    NULL,
    'kbizzi@bizzi-ice.com',
    NULL,
    'May-Sep Mo-So 11:00-22:00,  Oct-Apr Mo-So 11:00-19:00',
    'May-Sep Mo-Su 11:00-22:00; Oct-Apr Mo-Su 11:00-19:00',
    NULL,
    '{"organic":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 64: Pallina Gelato
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Pallina Gelato',
    '',
    'Fahrgasse',
    'Frankfurt am Main',
    '60311',
    50.1101754,
    8.6872254,
    'https://pallinagelato.de',
    '+49 69 34869345',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 65: Wacker's Kaffee Berger Straße
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wacker''s Kaffee Berger Straße',
    '',
    'Berger Straße 185',
    'Frankfurt am Main',
    '60385',
    50.1257136,
    8.7068471,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 66: Wacker's Kaffee Grüneburgweg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wacker''s Kaffee Grüneburgweg',
    '',
    'Grüneburgweg 29',
    'Frankfurt am Main',
    '60322',
    50.1209169,
    8.67212900000004,
    'https://wackers-kaffee.com/cafes#Grueneburgweg',
    '+49 69 977 899 00',
    NULL,
    NULL,
    'Mo-Sa 07:30-17:00,  So 09:00-17:00',
    'Mo-Sa 07:30-17:00; Su 09:00-17:00',
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 67: Wacker's Kaffee Innenstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wacker''s Kaffee Innenstadt',
    '',
    'Carl-Theodor-Reiffenstein-Platz',
    'Frankfurt am Main',
    '60313',
    50.112091,
    8.67931049999993,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 68: Wacker's Kaffee Schweizer Straße
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wacker''s Kaffee Schweizer Straße',
    '',
    'Schweizer Straße 18',
    'Frankfurt am Main',
    '60596',
    50.1043724,
    8.67844719999994,
    'https://wackers-kaffee.com/cafes',
    '+49 69 66058230',
    NULL,
    NULL,
    'Mo-Fr 08:00-19:30,  Sa 08:00-19:00,  So 09:00-19:00',
    'Mo-Fr 08:00-19:30; Sa 08:00-19:00; Su 09:00-19:00',
    NULL,
    '{"wheelchair":true,"outdoor_seating":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 69: Cha-Lo Teehaus | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Cha-Lo Teehaus | Bad Nauheim',
    'Hier wird der lose Tee in deine mitgebrachten Behälter gefüllt. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Parkstraße 6',
    'Bad Nauheim',
    '61231',
    50.36534,
    8.73993,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 70: Belis Teeparadies | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Belis Teeparadies | Wiesbaden',
    'Hier wird der lose Tee in deine mitgebrachten Behälter gefüllt, du sparst damit 10c pro Behältnis. Ebenso sparst du 10c bei der Befüllung deines eigenen To-Go-Bechers. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Untere Albrechtstraße',
    'Wiesbaden',
    '65189',
    50.0743878,
    8.2411916,
    NULL,
    NULL,
    NULL,
    NULL,
    'Di-Fr 12:00-18:30,  Sa 10:00-15:00,  So,Mo off',
    'Tu-Fr 12:00-18:30; Sa 10:00-15:00; Su,Mo off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 71: Federvieh
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Federvieh',
    'Das Geflügelfachgeschäft bietet verpackungsfreies Einkaufen an. Du kannst die Produkte in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Leipziger Straße',
    'Frankfurt am Main',
    '60487',
    50.1230661,
    8.6439456,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 72: Frankfurter Fass
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Frankfurter Fass',
    '',
    'Töngesgasse 38',
    'Frankfurt am Main',
    '60311',
    50.1134037,
    8.68304149999994,
    'https://www.frankfurter-fass.de/',
    NULL,
    NULL,
    NULL,
    'Mo,Di,Do,Fr 10:00-18:30,  Sa 10:00-16:00,  Mi off',
    'Mo,Tu,Th,Fr 10:00-18:30; Sa 10:00-16:00; We off',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 73: Käseladen Leipziger
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Käseladen Leipziger',
    'Dieser Käseladen bietet verpackungsfreies Einkaufen an. Du kannst die Produkte in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Leipziger Straße 34',
    'Frankfurt am Main',
    '60487',
    50.1218466,
    8.6477191,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 09:00-18:00,  Sa 09:00-15:00',
    'Mo-Fr 09:00-18:00; Sa 09:00-15:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 74: Käsestube - Gutes aus Milch
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Käsestube - Gutes aus Milch',
    'Neben Käse in allen Variationen gibt es Olivenöl und Balsamico-Essig zum Abfüllen. Eigene Behälter werden akzeptiert. Mehr Infos dazu: https://www.instagram.com/p/BxU6_69HagP/',
    'Schillerstraße 30-40',
    'Frankfurt am Main',
    '60313',
    50.1162407,
    8.67908729999999,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Do 11:30-20:00,  Fr 11:00-21:00,  Sa 11:00-19:00',
    'Mo-Th 11:30-20:00; Fr 11:00-21:00; Sa 11:00-19:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_milchtankstellen_id);

  -- Location 75: Metzgerei Waibel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Metzgerei Waibel',
    'Diese Metzgerei bietet verpackungsfreies Einkaufen an. Du kannst die Produkte in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Leipziger Straße 15',
    'Frankfurt am Main',
    '60487',
    50.1209678,
    8.6487298,
    'https://www.metzgerei-waibel.de',
    '+49 69 772634',
    NULL,
    NULL,
    'Mo-Fr 09:00-18:30, Sa 08:00-16:00',
    'Mo-Fr 09:00-18:30, Sa 08:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 76: Ciao Nonna | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Ciao Nonna | Bad Nauheim',
    'Dieser Laden bietet verpackungsfreies Einkaufen an. Du kannst die Produkte in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Parkstraße 4',
    'Bad Nauheim',
    '61231',
    50.365308,
    8.740204,
    'https://ciao-nonna.de/#pasta',
    NULL,
    NULL,
    NULL,
    'Di-Fr 10:00-18:00, Sa 10:00-14:00',
    'Tu-Fr 10:00-18:00, Sa 10:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 77: Heidi's Wurstladen | Kelkheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Heidi''s Wurstladen | Kelkheim',
    'Diese Metzgerei bietet verpackungsfreies Einkaufen an. Du kannst die Produkte in deine mitgebrachten Behälter füllen lassen. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Breslauer Straße 67',
    'Kelkheim (Taunus)',
    '65779',
    50.1338844,
    8.4554746,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 78: Mini Asia | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Mini Asia | Bad Nauheim',
    'Dieser asiatische Supermarkt bietet Mittagstisch als Take-Away an, welches du in deine mitgebrachten Behälter füllen lassen kannst. Das erkennst du auch an dem Sticker von "Einmal ohne bitte".',
    'Hauptstraße 21',
    'Bad Nauheim',
    '61231',
    50.3638569,
    8.7384512,
    'https://miniasia.eu/',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 79: Wajos | Neu-Isenburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wajos | Neu-Isenburg',
    '',
    'Peterstraße',
    'Neu-Isenburg',
    '63263',
    50.0501094,
    8.69901110000001,
    NULL,
    '+49 6102 5998377',
    NULL,
    NULL,
    'Mo-Sa 10:00-20:00',
    'Mo-Sa 10:00-20:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 80: Brühlhof Holsteins | Sulzbach Ts.
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Brühlhof Holsteins | Sulzbach Ts.',
    'Der Milchautomat ist rund um die Uhr zugänglich, auch an Feiertagen. Mehr Infos hier: https://www.heimischehoflaeden.de/hofladen/1-milchautomat-auf-dem-bruhlhof',
    'Im Brühl 13',
    'Sulzbach (Taunus)',
    '65843',
    50.1303087,
    8.53457219999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 81: Dairy Farm Wien | Friedrichsdorf
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Dairy Farm Wien | Friedrichsdorf',
    '',
    'Mainzer Straße',
    'Friedrichsdorf',
    '61381',
    50.25231,
    8.67192,
    NULL,
    NULL,
    NULL,
    NULL,
    '07:00-22:00',
    '07:00-22:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_milchtankstellen_id);

  -- Location 82: Hofladen Familie Lenhardt | Dreieich
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hofladen Familie Lenhardt | Dreieich',
    'Am Milchautomaten kann von 7 bis 19 Uhr Milch selbst gezapft werden. Im Hofcafé gibt es Kuchen und Eis sowie Milchprodukte aus eigener Erzeugung. Eisbecher wurden kürzlich auf Waffelbecher umgestellt.',
    'Am Kirchborn',
    'Götzenhain',
    '63303',
    50.0064498,
    8.74427170000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_feinkost_id);

  -- Location 83: Milchautomat Oranienhof | Wehrheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Milchautomat Oranienhof | Wehrheim',
    '',
    'Langwiesenweg',
    'Wehrheim',
    '61273',
    50.3040521,
    8.56166919999998,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_milchtankstellen_id);

  -- Location 84: Löw´s Milchtankstelle | Rodgau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Löw´s Milchtankstelle | Rodgau',
    '',
    'Ostweiler',
    'Rodgau',
    '63110',
    50.028503,
    8.90632299999993,
    NULL,
    NULL,
    NULL,
    NULL,
    'Täglich 24 Stunden',
    '24/7',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_milchtankstellen_id);

  -- Location 85: Alnatura Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Bockenheim',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Leipziger Straße 19',
    'Frankfurt am Main',
    '60487',
    50.121104,
    8.648474,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 08:00-21:00',
    'Mo-Sa 08:00-21:00',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 86: Alnatura Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Bornheim',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Burgstraße 106',
    'Frankfurt am Main',
    '60389',
    50.1265143,
    8.7020429,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 87: Alnatura Eckenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Eckenheim',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Karl-von-Drais-Straße 5',
    'Frankfurt am Main',
    '60435',
    50.14746,
    8.68143,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-20:00',
    'Mo-Sa 07:00-20:00',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 88: Alnatura Eschersheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Eschersheim',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Eschersheimer Landstraße 526-532',
    'Frankfurt am Main',
    '60433',
    50.1557449,
    8.6582781,
    'https://www.alnatura.de',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 08:00-21:00',
    'Mo-Sa 08:00-21:00',
    NULL,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 89: Alnatura Ostend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Ostend',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Hanauer Landstraße 110',
    'Frankfurt am Main',
    '60314',
    50.1111637,
    8.7093044,
    'https://www.alnatura.de/de-de/m%C3%A4rkte/alnatura-filialen-detailseiten/f/frankfurt-am-main-alnatura-super-natur-markt-f151',
    '+49 69 94340358',
    NULL,
    NULL,
    'Mo-Fr 07:30-20:00,  Sa 08:00-20:00',
    'Mo-Fr 07:30-20:00; Sa 08:00-20:00',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 90: Alnatura Westend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura Westend',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Bockenheimer Landstraße 13-15',
    'Frankfurt am Main',
    '60325',
    50.115597,
    8.669027,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 07:30-20:00, Sa 08:00-20:00',
    'Mo-Fr 07:30-20:00, Sa 08:00-20:00',
    '{"cash":true,"credit_cards":true,"contactless":true,"maestro":true,"mastercard":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 91: Galeria Karstadt Kaufhof
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Galeria Karstadt Kaufhof',
    'Süßigkeiten unverpackt einkaufen Mehr Infos dazu: https://www.instagram.com/p/B3usXNnoNZc/',
    'Zeil 116-126',
    'Frankfurt am Main',
    '60313',
    50.114447,
    8.67991099999995,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 92: Gärtnerei Anja Rappelt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Gärtnerei Anja Rappelt',
    '',
    'Am Sandberg 78',
    'Frankfurt am Main',
    '60599',
    50.0943145,
    8.70093710000003,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 93: Scheck-In-Center Ostend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scheck-In-Center Ostend',
    '',
    'Ferdinand-Happ-Straße 59',
    'Frankfurt am Main',
    '60314',
    50.1144059,
    8.71529940000005,
    NULL,
    '+49 69 94947630',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 94: Scheck-In Center Niederrad
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scheck-In Center Niederrad',
    '',
    'Hahnstraße 37-41',
    'Frankfurt am Main',
    '60528',
    50.0817433,
    8.63402730000007,
    NULL,
    '+49 69 60608080',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"toilets":true,"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 95: Scheck-In Center Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scheck-In Center Sachsenhausen',
    '',
    'Am Henninger Turm',
    'Frankfurt am Main',
    '60599',
    50.0973497,
    8.69336699999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 96: Sunflower Garten-Center
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Sunflower Garten-Center',
    'Neben Obst und Gemüse gibt es im Frischemarkt einige Lebensmittel lose zu kaufen wie Hülsenfrüchte und Trockenobst. Außerdem natürlich ein riesiges Angebot an Blumen und Kräutern. Mehr Infos dazu: https://www.instagram.com/p/Bx0P3EhilVf/',
    'Am Martinszehnten 15',
    'Frankfurt am Main',
    '60437',
    50.18915,
    8.65612999999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 97: Tegut Bahnhofsviertel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Bahnhofsviertel',
    '',
    'Kaiserstraße',
    'Frankfurt am Main',
    '60329',
    50.10832,
    8.66711,
    NULL,
    '+49 661 1042468',
    NULL,
    NULL,
    'Mo-Sa 07:00-23:00',
    'Mo-Sa 07:00-23:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 98: Tegut Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Bockenheim',
    '',
    'Leonardo-da-Vinci-Allee',
    'Frankfurt am Main',
    '60486',
    50.1137417,
    8.62639999999999,
    NULL,
    '+49 69 24705878',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 99: Tegut Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Bornheim',
    '',
    'Friedberger Landstraße 408',
    'Frankfurt am Main',
    '60389',
    50.1397827,
    8.69908209999994,
    'https://www.tegut.com/maerkte/markt/tegut-frankfurt-friedberger-landstr-408.html',
    '+49 69 13021990',
    NULL,
    NULL,
    'Mo-Sa 07:00-23:00',
    'Mo-Sa 07:00-23:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 100: Tegut Innenstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Innenstadt',
    '',
    'Kurt-Schumacher-Straße 30-32',
    'Frankfurt am Main',
    '60313',
    50.11407,
    8.68819,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-24:00',
    'Mo-Sa 07:00-24:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 101: Tegut Preungesheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Preungesheim',
    '',
    'Gravensteiner-Platz',
    'Frankfurt am Main',
    '60435',
    50.155924,
    8.69986159999996,
    NULL,
    '+49 69 54000987',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 102: Tegut Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut Sachsenhausen',
    '',
    'Mailänder Straße 8',
    'Frankfurt am Main',
    '60598',
    50.0916742,
    8.68839500000001,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 103: Alnatura | Eschborn
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura | Eschborn',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Ginnheimer Straße',
    'Eschborn',
    '65760',
    50.1420158,
    8.5813423,
    NULL,
    '+49 6196 8827989',
    NULL,
    NULL,
    'Mo-Sa 08:00-21:00',
    'Mo-Sa 08:00-21:00',
    NULL,
    '{"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 104: Alnatura | Kriftel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alnatura | Kriftel',
    'Bei Alnatura findest du * Obst, Gemüse und Eier unverpackt * viele trockene Produkte, Aufstriche und Kühlware in Pfandgläsern * nachhaltige Basics in der Hygieneabteilung wie Bambuszahnbürsten, Seifen etc.',
    'Kapellenstraße 50c',
    'Kriftel',
    '65830',
    50.0822772,
    8.4562993,
    'https://www.alnatura.de/',
    '+49 6192 2001441',
    NULL,
    NULL,
    'Mo-Sa 08:00-20:00',
    'Mo-Sa 08:00-20:00',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 105: Scheck-In Center | Mainz
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scheck-In Center | Mainz',
    '',
    'Weberstraße 15',
    'Mainz',
    '55130',
    49.9756918,
    8.288429,
    'https://www.scheck-in-center.de/filialen/mainz-weisenau/',
    '+49 6131 6029260',
    'kundenservice@edeka-suedwest.de',
    NULL,
    'Mo-Sa 07:00-22:00,  So,Feiertage geschlossen',
    'Mo-Sa 07:00-22:00; Su,PH off',
    '{"cash":true,"credit_cards":true,"maestro":true,"visa":true,"mastercard":true}'::jsonb,
    '{"wheelchair":true,"wifi":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 106: Scheck-In Center | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scheck-In Center | Offenbach',
    '',
    'Goethering 1',
    'Offenbach am Main',
    '63067',
    50.1060448,
    8.744287,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 107: Tegut | Altenstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Altenstadt',
    '',
    'Die Weidenbach',
    'Lindheim',
    '63674',
    50.289413,
    8.975788,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Do 07:00-21:00,  Fr-Sa 07:00-22:00',
    'Mo-Th 07:00-21:00; Fr-Sa 07:00-22:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 108: Tegut | Aschaffenburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Aschaffenburg',
    '',
    'Stollstraße',
    'Aschaffenburg',
    '63741',
    49.984456,
    9.132587,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-20:00',
    'Mo-Sa 07:00-20:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 109: Tegut | Bad Homburg vor der Höhe
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bad Homburg vor der Höhe',
    '',
    'Schaberweg',
    'Bad Homburg vor der Höhe',
    '61348',
    50.2206706,
    8.611278,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 110: Tegut | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bad Nauheim',
    '',
    'Schwalheimer Straße 79',
    'Bad Nauheim',
    '61231',
    50.356952,
    8.7491751,
    NULL,
    '+49 6611042634',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 111: Tegut | Bad Soden am Taunus
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bad Soden am Taunus',
    '',
    'Königsteiner Straße 31-343',
    'Bad Soden am Taunus',
    '65812',
    50.141018,
    8.50404320000007,
    'https://www.tegut.com/maerkte/markt/tegut-bad-soden-am-taunus-koenigsteiner-str-31-33.html',
    '+49 6196 527084',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    '{"cash":true,"credit_cards":true,"contactless":true,"visa":true,"mastercard":true,"american_express":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 112: Tegut | Bad Vilbel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bad Vilbel',
    '',
    'Friedberger Straße 89',
    'Bad Vilbel',
    '61118',
    50.1919735,
    8.74229300000002,
    'https://www.tegut.com/',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 08:00-22:00',
    'Mo-Sa 08:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 113: Tegut | Bensheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bensheim',
    '',
    'Heidelberger Straße 100',
    'Bensheim',
    '64625',
    49.669662,
    8.627636,
    'https://www.baeckerei-rauen.de/unsere-fachgeschaefte/tegut-bensheim/',
    '+4962511750390',
    NULL,
    NULL,
    'Mo-Sa 07:00-20:00, So 08:00-11:00',
    'Mo-Sa 07:00-20:00, Su 08:00-11:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 114: Tegut | Bischofsheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bischofsheim',
    '',
    'Hans-Dorr-Allee 1A',
    'Bischofsheim',
    '65474',
    49.9820809,
    8.3641431,
    'https://www.tegut.com/maerkte/markt/tegut-bischofsheim-hans-dorr-allee-1a.html',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    '{"cash":true,"credit_cards":true,"debit_cards":true,"contactless":true,"maestro":true,"visa":true,"mastercard":true,"american_express":true,"mobile_payment":true}'::jsonb,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 115: Tegut | Bodenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bodenheim',
    '',
    'Lange Ruthe 3',
    'Bodenheim',
    '55294',
    49.9253294,
    8.3249747,
    NULL,
    '+49 6135 9409600',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 116: Tegut | Braunfels
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Braunfels',
    '',
    'Wetzlarer Straße 18a',
    'Braunfels',
    '35619',
    50.519457,
    8.399105,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 117: Tegut | Bruchköbel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Bruchköbel',
    '',
    'Keltenstraße 18-20',
    'Bruchköbel',
    '63486',
    50.177826,
    8.908918,
    'https://www.tegut.com/maerkte/markt/tegut-bruchkoebel-keltenstr-18-20.html',
    '+49 6181 977730',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 118: Tegut | Darmstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Darmstadt',
    '',
    'Kasinostraße',
    'Darmstadt',
    '64293',
    49.883202,
    8.647203,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Do 07:00-22:00,  Fr,Sa 07:00-23:00',
    'Mo-Th 07:00-22:00; Fr,Sa 07:00-23:00',
    '{"cash":true,"credit_cards":true,"debit_cards":true,"contactless":true,"maestro":true,"visa":true,"mastercard":true,"mobile_payment":true}'::jsonb,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 119: Tegut | Dietzenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Dietzenbach',
    '',
    'Vélizystraße',
    'Dietzenbach',
    '63128',
    50.0171589,
    8.78771129999996,
    'https://www.tegut.com/maerkte/markt/tegut-dietzenbach-massayaplatz-3.html',
    '+49 6074 3047810',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 120: Tegut | Dreieich
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Dreieich',
    '',
    'Frankfurter Straße 70-72',
    'Sprendlingen',
    '63303',
    50.0236118,
    8.695127,
    'https://www.tegut.com',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 121: Tegut | Freigericht
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Freigericht',
    '',
    'Auf der Wehrweide',
    'Somborn',
    '63579',
    50.14696,
    9.10835,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 122: Tegut | Friedberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Friedberg',
    '',
    'Fauerbacher Straße 9',
    'Friedberg',
    '61169',
    50.334119,
    8.7619257,
    NULL,
    '+49 6031 1689770',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 123: Tegut | Friedberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Friedberg',
    '',
    'Anna-Kloos-Straße 1',
    'Friedberg',
    '61169',
    50.34414,
    8.74394,
    NULL,
    '+49 6031 6843370',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 124: Tegut | Gelnhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Gelnhausen',
    '',
    'Leipziger Straße',
    'Gelnhausen',
    '63571',
    50.205561,
    9.161396,
    'https://www.tegut.com/maerkte/markt/tegut-gelnhausen-roth-leipziger-str-74.html',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 125: Tegut | Ginsheim-Gustavsburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Ginsheim-Gustavsburg',
    '',
    'Adam-Opel-Straße 4-6',
    'Gustavsburg',
    '65462',
    49.98799,
    8.3255199,
    'https://www.tegut.com/maerkte/markt/tegut-ginsheim-gustavsburg-adam-opel-str-4-6.html',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00,  Feiertage geschlossen',
    'Mo-Sa 07:00-21:00; PH off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 126: Tegut | Griesheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Griesheim',
    '',
    'Feldstraße 13',
    'Griesheim',
    '64347',
    49.87045,
    8.55355,
    'https://tegut.com',
    '+49 6155 6074670',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 127: Tegut | Groß-Zimmern
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Groß-Zimmern',
    '',
    'Waldstraße 71b',
    'Groß-Zimmern',
    '64846',
    49.881392,
    8.820947,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 128: Tegut | Hanau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Hanau',
    '',
    'Heldenbergener Straße 4',
    'Hanau',
    '63452',
    50.1487208,
    8.90804700000001,
    'https://www.tegut.com/maerkte/markt/tegut-hanau-heldenbergener-str-4.html',
    '+49 6181 5799690',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 129: Tegut | Karben
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Karben',
    '',
    'Bahnhofstraße 190-196',
    'Kloppenheim',
    '61184',
    50.2333701,
    8.75590050000005,
    'https://www.tegut.com/maerkte/markt/tegut-karben-bahnhofstr-190-196.html',
    '+49 6039 4861180',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 130: Tegut | Kelsterbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Kelsterbach',
    '',
    'Mörfelder Straße 22',
    'Kelsterbach',
    '65451',
    50.0615898,
    8.53222559999995,
    NULL,
    '+49 6107 6392100',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    '{"cash":true,"credit_cards":true,"debit_cards":true}'::jsonb,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 131: Tegut | Kronberg im Taunus
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Kronberg im Taunus',
    '',
    'Frankfurter Straße 50-52',
    'Kronberg im Taunus',
    '61476',
    50.1741061,
    8.52308100000005,
    'https://www.tegut.com/',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 132: Tegut | Langenselbold
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Langenselbold',
    '',
    'Ringstraße 58',
    'Langenselbold',
    '63505',
    50.180064,
    9.027862,
    'https://www.tegut.com/maerkte/markt/tegut-langenselbold-ringstr-58.html',
    '+49 6184 92400',
    NULL,
    NULL,
    'Mo-Sa 7:00-21:00',
    'Mo-Sa 7:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 133: Tegut | Linsengericht
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Linsengericht',
    '',
    'Kleinbahnweg 3',
    'Altenhaßlau',
    '63589',
    50.19542,
    9.1986,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Do 07:00-21:00,  Fr,Sa 07:00-22:00,  So, Feiertage geschlossen',
    'Mo-Th 07:00-21:00; Fr,Sa 07:00-22:00; Su, PH off',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 134: Tegut | Maintal
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Maintal',
    '',
    'Braubachstraße 18',
    'Dörnigheim',
    '63477',
    50.1417102,
    8.83435320000001,
    NULL,
    '+49 6181 4236390',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 135: Tegut | Mainz Altstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Mainz Altstadt',
    '',
    'Holzhofstraße 9',
    'Mainz',
    '55116',
    49.994677,
    8.276276,
    'https://www.tegut.com/maerkte/markt/tegut-mainz-holzhofstr-9.html',
    '+4961311449988',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 136: Tegut | Mainz-Weisenau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Mainz-Weisenau',
    '',
    'Hechtsheimer Straße 2',
    'Mainz',
    '55130',
    49.9810495,
    8.2809911,
    'https://www.tegut.com/maerkte/markt/tegut-mainz-hechtsheimer-str-2.html',
    '+49 661 1042498',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"toilets":true,"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 137: Tegut | Mörfelden-Walldorf
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Mörfelden-Walldorf',
    '',
    'Gerauer Straße 54a',
    'Mörfelden',
    '64546',
    49.9675,
    8.56027779999999,
    'https://www.tegut.com/maerkte/markt/tegut-moerfelden-walldorf-gerauer-str-54-a.html',
    NULL,
    NULL,
    NULL,
    'Mo-Do 07:00-21:00,  Fr-Sa 07:00-22:00',
    'Mo-Th 07:00-21:00; Fr-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 138: Tegut | Mühlheim am Main
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Mühlheim am Main',
    '',
    'Schillerstraße 77-79',
    'Mühlheim am Main',
    '63165',
    50.1200514,
    8.84771049999995,
    NULL,
    '+49 6108 7938030',
    NULL,
    NULL,
    'Mo-Do 07:00-21:00,  Fr-Sa 07:00-22:00',
    'Mo-Th 07:00-21:00; Fr-Sa 07:00-22:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 139: Tegut | Niederdorfelden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Niederdorfelden',
    '',
    'Die Landwehr 1',
    'Niederdorfelden',
    '61138',
    50.190134,
    8.802511,
    NULL,
    '+49 6101 9979690',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 140: Tegut | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Offenbach',
    '',
    'Berliner Straße 178',
    'Offenbach am Main',
    '63067',
    50.10608,
    8.75449,
    NULL,
    '+49 69 271474280',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    '{"cash":true,"credit_cards":true,"debit_cards":true}'::jsonb,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 141: Tegut | Riedstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Riedstadt',
    '',
    'Lise-Meitner-Straße 2',
    'Wolfskehlen',
    '64560',
    49.85482,
    8.48628,
    'https://www.tegut.com/maerkte/markt/tegut-riedstadt-wolfskehlen-lise-meitneroppenheimer-str.html',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 142: Tegut | Rodenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Rodenbach',
    '',
    'Sonnenring',
    'Niederrodenbach',
    '63517',
    50.139558,
    9.023402,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 143: Tegut | Seligenstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Seligenstadt',
    '',
    'Frankfurter Straße 96',
    'Seligenstadt',
    '63500',
    50.04427,
    8.961919,
    'https://www.tegut.com/maerkte/markt/tegut-seligenstadt-frankfurter-str-96.html',
    '+49 6182 9938590',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 144: Tegut | Weiterstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Weiterstadt',
    '',
    'Max-Planck-Straße 6',
    'Weiterstadt',
    '64331',
    49.899569,
    8.593687,
    'https://www.tegut.com/',
    '+49 6150 1818730',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 145: Tegut | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Wiesbaden',
    '',
    'Frankfurter Straße 17b',
    'Wiesbaden',
    '65189',
    50.076917,
    8.249917,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 146: Tegut | Wiesbaden Naurod
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Wiesbaden Naurod',
    '',
    'Fondetter Straße 26',
    'Wiesbaden',
    '65207',
    50.139013,
    8.304048,
    NULL,
    '+49 6127 967955',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 147: Tegut | Wiesbaden Nordost
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Wiesbaden Nordost',
    '',
    'Richard-Wagner-Straße 86',
    'Wiesbaden',
    '65193',
    50.094277,
    8.249913,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 148: Tegut | Wiesbaden-Schierstein
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Wiesbaden-Schierstein',
    '',
    'Rheingaustraße 30',
    'Wiesbaden',
    '65201',
    50.0445361,
    8.2052236,
    'https://www.tegut.com/maerkte/markt/tegut-wiesbaden-schierstein-rheingaustr-30.html',
    '+49 611 2387990',
    NULL,
    NULL,
    'Mo-Sa 07:00-22:00',
    'Mo-Sa 07:00-22:00',
    '{"credit_cards":true,"contactless":true,"visa":true,"mastercard":true}'::jsonb,
    '{"wheelchair":true,"organic":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 149: Tegut | Wölfersheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Tegut | Wölfersheim',
    '',
    'Biedrichstraße 13',
    'Wölfersheim',
    '61200',
    50.39659,
    8.816573,
    NULL,
    '+49 6036 983080',
    NULL,
    NULL,
    'Mo-Sa 07:00-21:00',
    'Mo-Sa 07:00-21:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_bio_regional_id);

  -- Location 150: Bürstenhaus
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bürstenhaus',
    'Hier gibt es Bürsten aller Art aus verschienden Naturborsten, sowie diverse Zero Waste Basics wie Rasierhobel und Olivenölseife. Mehr Infos dazu: https://www.instagram.com/p/Bq73tXAHLJJ/',
    'Töngesgasse',
    'Frankfurt am Main',
    '60311',
    50.113204,
    8.68303700000001,
    'https://buerstenhaus.de/',
    '+49 69 283313',
    'buerstenhaus@t-online.de',
    NULL,
    'Mo-Fr 10:00-18:00,  Sa 11:00-17:00',
    'Mo-Fr 10:00-18:00; Sa 11:00-17:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 151: Hintz-Bürsten Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hintz-Bürsten Bockenheim',
    '',
    'Adalbertstraße 11',
    'Frankfurt am Main',
    '60486',
    50.119712,
    8.6480951,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 10:30-18:00,  Sa 10:30-16:00',
    'Mo-Fr 10:30-18:00; Sa 10:30-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 152: Langbrett
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Langbrett',
    '',
    'Kleiner Hirschgraben 3',
    'Frankfurt am Main',
    '60311',
    50.1121322,
    8.67892729999994,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 153: Lush Cosmetics
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Lush Cosmetics',
    '',
    'Zeil',
    'Frankfurt am Main',
    '60313',
    50.1148648,
    8.68134090000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 154: Manufactum
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Manufactum',
    'Hier gibt es Plastikfreies für Küche, Bad und Haushalt und vieles mehr. Mehr Infos dazu: https://www.instagram.com/p/B29wlScom04/',
    'Bockenheimer Anlage',
    'Frankfurt am Main',
    '60322',
    50.1160192,
    8.67055430000005,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 155: Meder
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Meder',
    '',
    'Berger Straße 198',
    'Frankfurt am Main',
    '60385',
    50.1258155,
    8.7074973,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 156: Hintz-Bürsten | Neu-Anspach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hintz-Bürsten | Neu-Anspach',
    '',
    'Laubweg 5',
    'Neu-Anspach',
    '61267',
    50.2756814,
    8.53082810000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 157: LUSH Cosmetics | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'LUSH Cosmetics | Wiesbaden',
    '',
    'Kirchgasse 51',
    'Wiesbaden',
    '65183',
    50.082367,
    8.238932,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_haushalt_pflege_id);

  -- Location 158: Bauernmarkt Konstablerwache
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bauernmarkt Konstablerwache',
    'Markttage und -zeiten: Donnerstag: 10-20 Uhr Samstag: 8-17 Uhr Mehr Infos dazu: https://www.instagram.com/p/BuPF55MHjrY/',
    'Konstablerwache',
    'Frankfurt am Main',
    '60313',
    50.114476,
    8.68695619999994,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 159: Blumenmarkt am Liebfrauenberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Blumenmarkt am Liebfrauenberg',
    'Markttage und -zeiten: Freitag: 9-18 Uhr www.hfm-frankfurt.de/sondermaerkte',
    'Liebfrauenberg 54',
    'Frankfurt am Main',
    '60313',
    50.1129065,
    8.68165880000004,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 160: Kleinmarkthalle
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Kleinmarkthalle',
    '',
    'Hasengasse 5-7',
    'Frankfurt am Main',
    '60311',
    50.1128317,
    8.68384990000004,
    'https://kleinmarkthalle.de/',
    NULL,
    NULL,
    NULL,
    'Mo-Fr 08:00-18:00,  Sa 08:00-16:00,  Feiertage geschlossen',
    'Mo-Fr 08:00-18:00; Sa 08:00-16:00; PH off',
    NULL,
    '{"toilets":true,"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 161: Markt am Osthafen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Markt am Osthafen',
    'Markttage und -zeiten: Mittwoch: 11-14 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Hanauer Landstraße 208-216',
    'Frankfurt am Main',
    '60314',
    50.1126548,
    8.7202227,
    'https://www.me-ta.de/',
    '+49 69 87 00 182-0',
    NULL,
    NULL,
    'Mo-Fr 08:00-18:30,  Sa 08:00-16:00',
    'Mo-Fr 08:00-18:30; Sa 08:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 162: Schillermarkt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Schillermarkt',
    'Markttage und -zeiten: Freitag: 9-18:30 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Schillerstraße 2',
    'Frankfurt am Main',
    '60313',
    50.1148806,
    8.6785539,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/schillermarkt',
    NULL,
    NULL,
    NULL,
    'Fr 09:00-18:30,  Feiertage geschlossen',
    'Fr 09:00-18:30; PH off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 163: Wochenmarkt Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Bockenheim',
    'Markttage und -zeiten: Donnerstag: 8-18 Uhr',
    'Hannelore-Elsner-Platz',
    'Frankfurt am Main',
    '60325',
    50.120058,
    8.65137270000002,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/wochenmarkt-bockenheim',
    NULL,
    NULL,
    NULL,
    'Mi 08:00-18:00 unknown "moved to and open on Midnesday only when Doursday is a public holiday (it is closed on Doursday then)", Do 08:00-18:00 open,  Feiertage geschlossen',
    'We 08:00-18:00 unknown "moved to and open on Wednesday only when Thursday is a public holiday (it is closed on Thursday then)", Th 08:00-18:00 open; PH closed',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 164: Wochenmarkt Bonames
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Bonames',
    'Markttage und -zeiten: Donnerstag: 13-20 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Am Wendelsgarten',
    'Frankfurt am Main',
    '60437',
    50.1850941,
    8.66561879999995,
    NULL,
    NULL,
    NULL,
    NULL,
    'Do 13:00-20:00',
    'Th 13:00-20:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 165: Wochenmarkt Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Bornheim',
    'Markttage und -zeiten: Mittwoch: 8-18:30 Uhr Samstag: 8-16 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Wochenmarkt Bornheim',
    'Frankfurt am Main',
    '60385',
    50.1257173,
    8.70718839999995,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/wochenmarkt-bornheim',
    NULL,
    NULL,
    NULL,
    'Mi 08:00-18:30,  Sa 08:00-16:00',
    'We 08:00-18:30; Sa 08:00-16:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 166: Wochenmarkt Campus Westend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Campus Westend',
    'Markttage und -zeiten: Donnerstag: 9-17 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Bremer Straße',
    'Frankfurt am Main',
    '60323',
    50.1269408,
    8.67100240000002,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 167: Wochenmarkt City-West
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt City-West',
    'Markttage und -zeiten: Mittwoch: 10-20 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Celsiusplatz',
    'Frankfurt am Main',
    '60486',
    50.1171741,
    8.63314509999998,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 168: Wochenmarkt Dornbusch
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Dornbusch',
    'Markttage und -zeiten: Dienstag: 8-18 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Carl-Goerdeler-Straße',
    'Frankfurt am Main',
    '60320',
    50.140184,
    8.67121589999999,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 169: Wochenmarkt Friedberger Warte
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Friedberger Warte',
    'Markttage und -zeiten: Dienstag: 8-18 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Friedberger Landstraße 414',
    'Frankfurt am Main',
    '60389',
    50.1406285,
    8.69919909999999,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 170: Wochenmarkt Gallus
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Gallus',
    'Markttage und -zeiten: Freitag: 8-18:30 Uhr',
    'Sulzbacher Straße',
    'Frankfurt am Main',
    '60326',
    50.1041006,
    8.63524989999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 171: Wochenmarkt Heddernheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Heddernheim',
    'Markttage und -zeiten: Freitag: 9-18 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Karl-Perott-Platz',
    'Frankfurt am Main',
    '60439',
    50.160314,
    8.64565600000003,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/wochenmarkt-heddernheim',
    NULL,
    NULL,
    NULL,
    'Fr 09:00-18:00',
    'Fr 09:00-18:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 172: Wochenmarkt Höchst & Markthalle
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Höchst & Markthalle',
    'Markttage und -zeiten: Dienstag: 7-13 Uhr Freitag: 7-13 Uhr Samstag: 7-13 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Höchster Markt 4',
    'Frankfurt am Main',
    '65929',
    50.0995147,
    8.5460738,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 173: Wochenmarkt Kaiserstraße
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Kaiserstraße',
    'Markttage und -zeiten: Dienstag: 9-19 Uhr Donnerstag: 9-19 Uhr https://markthandel.de/maerkte_lms.htm',
    'Kaiserstraße 79',
    'Frankfurt am Main',
    '60329',
    50.107464,
    8.66577840000002,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 174: Wochenmarkt Niederrad
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Niederrad',
    'Markttage und -zeiten: Samstag: 8-16 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Bruchfeldstraße 51',
    'Frankfurt am Main',
    '60528',
    50.0865818,
    8.64457449999998,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/wochenmarkt-niederrad',
    NULL,
    NULL,
    NULL,
    'Sa 08:00-16:00',
    'Sa 08:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 175: Wochenmarkt Nordend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Nordend',
    'Markttage und -zeiten: Freitag: 10-20 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Friedberger Platz',
    'Frankfurt am Main',
    '60316',
    50.1235132,
    8.6922406,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 176: Wochenmarkt Nordwestzentrum
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Nordwestzentrum',
    'Markttage und -zeiten: Mittwoch: 9-18 Uhr https://frankfurt.treffpunkt-wochenmarkt.de/',
    'Walter-Möller-Platz 1a',
    'Frankfurt am Main',
    '60439',
    50.1579986,
    8.63292009999998,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 177: Wochenmarkt Oberrad
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Oberrad',
    'Markttage und -zeiten: Samstag: 9-16 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Oberräder Markt',
    'Frankfurt am Main',
    '60599',
    50.100715,
    8.7241789,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 178: Wochenmarkt Preungesheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Preungesheim',
    'Markttage und -zeiten: Freitag: 11-19 Uhr',
    'Gravensteiner-Platz',
    'Frankfurt am Main',
    '60435',
    50.1556463,
    8.69821139999999,
    NULL,
    NULL,
    NULL,
    NULL,
    'Fr 11:00-19:00',
    'Fr 11:00-19:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 179: Wochenmarkt Riedberg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Riedberg',
    'Markttage und -zeiten: Samstag: 9-16 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Riedbergplatz',
    'Frankfurt am Main',
    '60438',
    50.1767158,
    8.62939230000006,
    NULL,
    NULL,
    NULL,
    NULL,
    'Sa 09:00-16:00',
    'Sa 09:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 180: Wochenmarkt Rödelheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Rödelheim',
    'Markttage und -zeiten: Mittwoch: 8-18 Uhr www.hfm-frankfurt.de/wochenmarkt',
    'Arthur-Stern-Platz',
    'Frankfurt am Main',
    '60489',
    50.12392,
    8.6066634,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mi 08:00-18:00',
    'Mi 08:00-18:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 181: Wochenmarkt Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt Sachsenhausen',
    'Markttage und -zeiten: Dienstag: 8-18 Uhr Freitag: 8-18 Uhr Mehr Infos dazu: https://www.instagram.com/p/BxkvNEiieop/',
    'Diesterwegplatz',
    'Frankfurt am Main',
    '60594',
    50.1000202,
    8.68559089999997,
    'https://frankfurt.de/frankfurt-entdecken-und-erleben/einkaufen-in-frankfurt/maerkte-und-flohmaerkte/wochenmaerkte/wochenmarkt-sachsenhausen',
    NULL,
    NULL,
    NULL,
    'Di,Fr 08:00-18:00',
    'Tu,Fr 08:00-18:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 182: Wochenmarkt | Bad Nauheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt | Bad Nauheim',
    'Markttage und -zeiten: Dienstag: 12-18 Uhr Freitag: 8:30-13 Uhr https://markthandel.de/maerkte_lms.htm',
    'Stresemannstraße',
    'Bad Nauheim',
    '61231',
    50.3651421,
    8.7381892,
    NULL,
    NULL,
    NULL,
    NULL,
    'Di 12:00-18:00,  Fr 08:30-13:00',
    'Tu 12:00-18:00; Fr 08:30-13:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 183: Wochenmarkt | Langen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt | Langen',
    'Markttage und -zeiten: Samstag: 8-14 Uhr https://markthandel.de/maerkte_lms.htm',
    'Flachsbachstraße',
    'Langen',
    '63225',
    49.9885045,
    8.6714667,
    'https://www.langen.de/de/feste-und-maerkte.html',
    NULL,
    NULL,
    NULL,
    'Di,Fr 08:00-13:00',
    'Tu,Fr 08:00-13:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 184: Wochenmarkt | Maintal-Dörnigheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt | Maintal-Dörnigheim',
    'Markttage und -zeiten: Dienstag: 7-13 Uhr www.maintal.de/seite/134460/wochenm%C3%A4rkte.html',
    'Berliner Straße 64-66',
    'Dörnigheim',
    '63477',
    50.1366,
    8.84475999999995,
    NULL,
    NULL,
    NULL,
    NULL,
    'Di 07:00-13:00,  Feiertage geschlossen',
    'Tu 07:00-13:00; PH off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 185: Wochenmarkt | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wochenmarkt | Offenbach',
    'Markttage und -zeiten: Dienstag: 8-14 Uhr Freitag: 8-14 Uhr Samstag: 8-14 Uhr Vom 01.04.-30.09. schon ab 7 Uhr www.offenbach.de/gaeste/sehenswert/wilhelmsplatz/wochenmarkt.php',
    'Offenbacher Wochenmarkt',
    'Offenbach am Main',
    '63065',
    50.1039905,
    8.7659683,
    'https://www.offenbach.de/gaeste/sehenswert/wilhelmsplatz/wochenmarkt.php',
    NULL,
    NULL,
    NULL,
    'Apr-Sep Di,Fr,Sa 07:00-14:00,  Oct-Mar Di,Fr,Sa 08:00-14:00',
    'Apr-Sep Tu,Fr,Sa 07:00-14:00; Oct-Mar Tu,Fr,Sa 08:00-14:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_wochenmaerkte_id);

  -- Location 186: Flohmarkt Schaumainkai
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Flohmarkt Schaumainkai',
    'Jeden zweiten Samstag von 9 bis 14 Uhr. Termine: www.hfm-frankfurt.de/flohmaerkte',
    'Schaumainkai',
    'Frankfurt am Main',
    '60594',
    50.1043129,
    8.67501330000005,
    NULL,
    NULL,
    NULL,
    NULL,
    'week 1-53/2 Fr 08:00-14:00',
    'week 1-53/2 Fr 08:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_flohmaerkte_id);

  -- Location 187: Flohmarkt Lindleystraße
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Flohmarkt Lindleystraße',
    'Jeden zweiten Samstag von 9 bis 14 Uhr. Termine: www.hfm-frankfurt.de/flohmaerkte',
    'Lindleystraße',
    'Frankfurt am Main',
    '60314',
    50.1128286,
    8.72062900000003,
    NULL,
    NULL,
    NULL,
    NULL,
    'week 2-52/2 Fr 08:00-14:00',
    'week 2-52/2 Fr 08:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_flohmaerkte_id);

  -- Location 188: Amanel - Natur für Baby und Kind
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Amanel - Natur für Baby und Kind',
    '',
    'Sigmund-Freud-Straße',
    'Frankfurt am Main',
    '60435',
    50.153316,
    8.68053199999997,
    'https://www.amanel.de/',
    NULL,
    NULL,
    NULL,
    'Mo-Fr 09:00-14:00,  Sa 09:00-14:00',
    'Mo-Fr 09:00-14:00; Sa 09:00-14:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 189: Anton Emma
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Anton Emma',
    '',
    'Mainkurstraße 11',
    'Frankfurt am Main',
    '60385',
    50.1249903,
    8.7082746,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 190: Atdress
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Atdress',
    '',
    'Mainkurstraße 3',
    'Frankfurt am Main',
    '60385',
    50.1252285,
    8.7077472,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 191: BUNT
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'BUNT',
    '',
    'Rendeler Straße 54',
    'Frankfurt am Main',
    '60385',
    50.1277601,
    8.709478,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 192: Charlotte am Main
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Charlotte am Main',
    '',
    'Rohrbachstraße',
    'Frankfurt am Main',
    '60389',
    50.1290726,
    8.700239,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 11:00-16:00',
    'Mo-Sa 11:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 193: Early
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Early',
    '',
    'Burgstraße 70',
    'Frankfurt am Main',
    '60389',
    50.1252506,
    8.6999311,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 194: EKN Footwear
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'EKN Footwear',
    '',
    'Danziger Platz 2',
    'Frankfurt am Main',
    '60314',
    50.1126897,
    8.70620229999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 195: GEA Schuhe
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'GEA Schuhe',
    'Hier gibt es qualitativ hochwertige und nachhaltige Schuhe von Waldviertler aus Österreich. Für die Schuhe gibt es neue Einlagen, sie können neu besohlt werden. Kurz: alles, was repariert und ersetzt werden kann, wird auch gemacht. So können die Schuhe auch locker drei oder vier Kinder aushalten. Weiterhin werden nachhaltige Möbel und zum Beispiel auch Kinderwägen angeboten. Mehr Infos dazu: https://www.instagram.com/p/BzbP8p6i2mp/',
    'Pfingstweidstraße',
    'Frankfurt am Main',
    '60316',
    50.115981,
    8.6960517,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 196: Glore Frankfurt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Glore Frankfurt',
    'Ausgiebiges Sortiment an Damen- und Herrenmode von tollen nachhaltigen Labels. Mehr Infos dazu: https://www.instagram.com/p/B3jHkP0oWRC/',
    'Oeder Weg',
    'Frankfurt am Main',
    '60318',
    50.1217923,
    8.68025969999997,
    'https://www.glore.de/Concept-Stores/Frankfurt/',
    '+49 69 79189935',
    'frankfurt@glore.de',
    NULL,
    'Mo-Fr 11:00-19:00,  Sa 11:00-18:00',
    'Mo-Fr 11:00-19:00; Sa 11:00-18:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 197: Grüne Erde Store
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Grüne Erde Store',
    'Nachhaltige Mode für Damen und viele Zero Waste Basics. Auch Möbel aus Naturmaterialien und Schlafwelt zum Probeliegen. Mehr Infos dazu: https://www.instagram.com/p/BqIVMhUn6wp/',
    'Kaiserstraße 5',
    'Frankfurt am Main',
    '60311',
    50.111453,
    8.67664579999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 198: Gudrun Sjödén
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Gudrun Sjödén',
    '',
    'Kaiserstraße 5',
    'Frankfurt am Main',
    '60311',
    50.1113868,
    8.67658890000007,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 199: Hessnatur Store
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hessnatur Store',
    'Mehr Infos dazu: www.instagram.com/p/Bu_sidkH8cc/',
    'Kaiserstraße 3',
    'Frankfurt am Main',
    '60311',
    50.1115073,
    8.67673190000005,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 200: mi.na
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'mi.na',
    'Mehr Infos dazu: www.instagram.com/p/CqrumssojbI',
    'Berger Straße 112',
    'Frankfurt am Main',
    '60316',
    50.1223546,
    8.7003699,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 201: Number Seven
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Number Seven',
    'Mehr Infos dazu: www.instagram.com/p/CqrumssojbI',
    'Berger Straße 110',
    'Frankfurt am Main',
    '60316',
    50.1222829,
    8.7002091,
    'http://number-seven.com',
    '+49 69 436664',
    NULL,
    NULL,
    'So,Feiertage geschlossen,  Mo-Fr 11:00-18:00,  Sa 11:00-18:00',
    'Su,PH off; Mo-Fr 11:00-18:00; Sa 11:00-18:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 202: Quartier Frau
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Quartier Frau',
    '',
    'Bornheimer Landstraße 54',
    'Frankfurt am Main',
    '60316',
    50.1230108,
    8.6939226,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mi-Fr 14:00-19:00,  Sa 11:00-17:00',
    'We-Fr 14:00-19:00; Sa 11:00-17:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 203: Sonnylemon
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Sonnylemon',
    '',
    'Heidestraße',
    'Frankfurt am Main',
    '60385',
    50.1277505,
    8.7084266,
    'https://www.sonnylemon.de/',
    '+49 69 95638110',
    'info@sonnylemon.de',
    NULL,
    'Mo 14:00-18:00,  Di-Fr 10:30-18:00,  Sa 11:00-18:00',
    'Mo 14:00-18:00; Tu-Fr 10:30-18:00; Sa 11:00-18:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 204: Weltladen Fair Fashion Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Weltladen Fair Fashion Bornheim',
    '',
    'Berger Straße 133',
    'Frankfurt am Main',
    '60385',
    50.124036,
    8.7033847,
    'https://www.weltladen-bornheim.de/',
    '+49 69 4930101',
    'info@weltladen-bornheim.de',
    NULL,
    'Mo-Fr 10:00-19:00,  Sa 10:00-18:00,  Feiertage geschlossen',
    'Mo-Fr 10:00-19:00; Sa 10:00-18:00; PH off',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 205: Wunderwerk
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Wunderwerk',
    '',
    'Berger Straße 54',
    'Frankfurt am Main',
    '60316',
    50.1206279,
    8.69660640000006,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 206: Hessnatur Outlet | Butzbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hessnatur Outlet | Butzbach',
    'Mehr Infos dazu: www.instagram.com/p/B0mA8BSoMRV/',
    'Otto-Hahn-Straße 23',
    'Butzbach',
    '35510',
    50.4303628,
    8.6857869,
    'https://www.hessnatur.com/de/store/outlet-butzbach',
    '+49 6033 971466',
    'outlet.butzbach@hess-natur.de',
    NULL,
    'Mo-Fr 10:00-18:00,  Sa 10:00-17:00',
    'Mo-Fr 10:00-18:00; Sa 10:00-17:00',
    '{"cash":true,"credit_cards":true,"debit_cards":true}'::jsonb,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 207: Hessnatur Store | Butzbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hessnatur Store | Butzbach',
    '',
    'Marie-Curie-Straße 7',
    'Butzbach',
    '35510',
    50.4292185,
    8.69068459999994,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 208: Maas Naturwaren | Bad Homburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Maas Naturwaren | Bad Homburg',
    '',
    'Ludwigstraße 10',
    'Bad Homburg vor der Höhe',
    '61348',
    50.226813,
    8.61838,
    'https://maas-natur.de/laeden/laden-bad-homburg/',
    NULL,
    'badhomburg@maas-natur.de',
    NULL,
    'Mo-Fr 10:00-18:00,  Sa 10:00-16:00',
    'Mo-Fr 10:00-18:00; Sa 10:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 209: Passepartout | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Passepartout | Offenbach',
    '',
    'Senefelderstraße 47',
    'Offenbach am Main',
    '63069',
    50.0960034,
    8.762397,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 210: Aschenputtel Second Hand
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Aschenputtel Second Hand',
    '',
    'An der Kleinmarkthalle 11',
    'Frankfurt am Main',
    '60311',
    50.112248,
    8.68224199999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 211: AURUM Second Hand Boutique
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'AURUM Second Hand Boutique',
    '',
    'Taubenstraße 11',
    'Frankfurt am Main',
    '60313',
    50.1160537,
    8.6775768,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 212: Bonne Chance
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bonne Chance',
    '',
    'Schillerstraße 28',
    'Frankfurt am Main',
    '60313',
    50.1160206,
    8.67897470000003,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 11:00-18:00,  Sa 10:00-16:00',
    'Mo-Fr 11:00-18:00; Sa 10:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 213: Carpe Diem First & Second Hand'ler
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Carpe Diem First & Second Hand''ler',
    '',
    'Roßmarkt 12',
    'Frankfurt am Main',
    '60311',
    50.1126787,
    8.67741019999994,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 214: DRK Kleideratelier mit Nähecke
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleideratelier mit Nähecke',
    '',
    'Alt-Sossenheim 42',
    'Frankfurt am Main',
    '65936',
    50.1202824,
    8.567144,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 215: DRK Kleiderladen Kreuz & Quer
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen Kreuz & Quer',
    '',
    'Linkstraße',
    'Frankfurt am Main',
    '65933',
    50.0925,
    8.60685999999998,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 216: Edel Trödel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Edel Trödel',
    '',
    'Luisenstraße 5',
    'Frankfurt am Main',
    '60316',
    50.1211097,
    8.69578409999997,
    'https://frankfurter-edeltroedel.de/',
    NULL,
    NULL,
    NULL,
    'Mi-Fr 11:00-18:00,  Sa 10:00-16:00',
    'We-Fr 11:00-18:00; Sa 10:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 217: epiphany - Vintage & More
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'epiphany - Vintage & More',
    '',
    'Zeil',
    'Frankfurt am Main',
    '60313',
    50.1150062,
    8.69262639999999,
    NULL,
    '+49 69 97769660',
    NULL,
    NULL,
    'Mo-Sa 11:00-18:30',
    'Mo-Sa 11:00-18:30',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 218: Kroetenkiste "Alles rund ums Kind"
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Kroetenkiste "Alles rund ums Kind"',
    '',
    'Alt-Enkheim 6',
    'Frankfurt am Main',
    '60388',
    50.14967,
    8.75370899999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 219: Matilda 2nd Hand Kinderwarenladen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Matilda 2nd Hand Kinderwarenladen',
    '',
    'Laubestraße 1',
    'Frankfurt am Main',
    '60594',
    50.10461,
    8.68476999999996,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 220: Monsters Kindersecondhandladen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Monsters Kindersecondhandladen',
    '',
    'Wiesenstraße 46',
    'Frankfurt am Main',
    '60385',
    50.127091,
    8.70394340000007,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 221: Neufundland Second-Hand-Warenhaus
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Neufundland Second-Hand-Warenhaus',
    'Vom Unikat bis zur kompletten Einrichtung, von der Jeans bis zur Waschmaschine. Bei Neufundland findest du gute gebrauchte Stücke zu fairen Preisen. für alle. Kleinere Spenden kannst du über den Kofferraumservice abgeben. Für größere Spenden, wie z.B. Möbel, sollte ein Abholungstermin vereinbart werden.',
    'Lärchenstraße 135',
    'Frankfurt am Main',
    '65933',
    50.0962992,
    8.58853799999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 222: Ola Ware Second Hand & Vintage Mode
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Ola Ware Second Hand & Vintage Mode',
    '',
    'Vogelsbergstraße 33',
    'Frankfurt am Main',
    '60316',
    50.1250893,
    8.6928956,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 223: Outflip
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Outflip',
    'Cooler Second Hand Laden in Bornheim. Die Klamotten, Schuhe, Taschen und Accessoires werden für etwa vier Wochen in Kommission angenommen. Das Angebot wechselt also ständig, es lohnt sich regelmäßig vorbeizuschauen. Mehr Infos dazu: https://www.instagram.com/p/CCNcXgdgyns/',
    'Höhenstraße 30',
    'Frankfurt am Main',
    '60385',
    50.124034,
    8.70062210000003,
    'https://outflip.de/',
    '+49 69 492222',
    'info@outflip.de',
    NULL,
    'Mo-Fr 14:00-18:30,  Sa 11:00-17:00',
    'Mo-Fr 14:00-18:30; Sa 11:00-17:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 224: Oxfam Buchshop Innenstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Buchshop Innenstadt',
    '',
    'Töngesgasse 35',
    'Frankfurt am Main',
    '60311',
    50.1129994,
    8.68221249999999,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 225: Oxfam Fashionshop Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Fashionshop Bockenheim',
    '',
    'Leipziger Straße 54',
    'Frankfurt am Main',
    '60487',
    50.1226438,
    8.64621220000004,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 226: Oxfam Fashionshop Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Fashionshop Sachsenhausen',
    '',
    'Schweizer Straße 55',
    'Frankfurt am Main',
    '60594',
    50.1014287,
    8.68124220000004,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 227: Oxfam Shop Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Shop Bornheim',
    '',
    'Merianplatz 9',
    'Frankfurt am Main',
    '60316',
    50.1203827,
    8.69520769999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 228: Oxfam Shop Nordend
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Shop Nordend',
    '',
    'Oeder Weg 32',
    'Frankfurt am Main',
    '60318',
    50.1200448,
    8.6799031,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 229: Peggy Sue Vintage
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Peggy Sue Vintage',
    '',
    'Wallstraße 20',
    'Frankfurt am Main',
    '60594',
    50.10527,
    8.68821,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 230: "raus aus dem keller" Antiquitäten, Schmuck, Porzellan uvm.
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    '"raus aus dem keller" Antiquitäten, Schmuck, Porzellan uvm.',
    '',
    'Schloßstraße 7',
    'Frankfurt am Main',
    '60486',
    50.123692,
    8.63661200000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 231: ReSales
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'ReSales',
    '',
    'Elisabethenstraße 14-16',
    'Frankfurt am Main',
    '60594',
    50.1060193,
    8.68816870000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 232: Samt & Sonders XXL (ehem. Familien-Markt)
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Samt & Sonders XXL (ehem. Familien-Markt)',
    'In diesem Second Hand Kaufhaus kann jede:r einkaufen. Gegen Vorlage eines Frankfurt-Passes oder weiteren Nachweisen (s. Website) erhältst du Rabatte. Gut erhaltene Sachspenden werden gerne entgegen genommen. - Mode für Damen, Herren und Kinder - Heimtextilien - Haushaltsartikel - Spielzeug - Möbel - Elektrogeräte',
    'Röntgenstraße 10',
    'Frankfurt am Main',
    '60388',
    50.1422515,
    8.7479218,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 233: Scarlett Second Hand Boutique
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Scarlett Second Hand Boutique',
    '',
    'An der Kleinmarkthalle 5',
    'Frankfurt am Main',
    '60311',
    50.1124584,
    8.68324059999998,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 234: Stellas First- und Secondhand
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Stellas First- und Secondhand',
    '',
    'Sandweg 24',
    'Frankfurt am Main',
    '60316',
    50.1175685,
    8.69652050000002,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 235: Style Definery Showroom
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Style Definery Showroom',
    '',
    'Liebigstraße 23',
    'Frankfurt am Main',
    '60323',
    50.1198773,
    8.6655241,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 236: Vintage Revivals Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Vintage Revivals Bornheim',
    '',
    'Berger Straße 131',
    'Frankfurt am Main',
    '60385',
    50.1239913,
    8.7032175,
    'https://www.vintagerevivals.de/de/',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 11:00-19:00',
    'Mo-Sa 11:00-19:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 237: Vintage Revivals Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Vintage Revivals Sachsenhausen',
    '',
    'Wallstraße',
    'Frankfurt am Main',
    '60594',
    50.10514,
    8.68754999999999,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 238: Yasmini - für Mutter und Kind
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Yasmini - für Mutter und Kind',
    '',
    'Marburger Straße',
    'Frankfurt am Main',
    '60487',
    50.1240136,
    8.64293069999997,
    'https://www.yasmini.de/',
    '+49 69 77039894',
    'info@yasmini.de',
    NULL,
    'Mo-Fr 10:00-18:00,  Sa 10:00-16:00',
    'Mo-Fr 10:00-18:00; Sa 10:00-16:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 239: Königskinder | Neu-Isenburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Königskinder | Neu-Isenburg',
    '',
    'Waldstraße 98',
    'Neu-Isenburg',
    '63263',
    50.0530758,
    8.69203970000001,
    NULL,
    NULL,
    NULL,
    NULL,
    'Di-Fr 11:00-18:00,  Sa 10:00-13:00',
    'Tu-Fr 11:00-18:00; Sa 10:00-13:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 240: DRK Kleiderladen | Bad Vilbel
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen | Bad Vilbel',
    '',
    'Landgrabenstraße 10',
    'Bad Vilbel',
    '61118',
    50.1762731,
    8.7355577,
    'https://www.drk-friedberg.de/angebote/existenzsichernde-hilfe/kleiderlaeden/oeffnungszeiten.html',
    NULL,
    'info@drk-friedberg.de',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 241: DRK Kleiderladen | Langen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen | Langen',
    '',
    'Gartenstraße 1',
    'Langen',
    '63225',
    49.9901894,
    8.6745701,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 242: DRK Kleiderladen | Mühlheim am Main
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen | Mühlheim am Main',
    '',
    'Offenbacher Straße 39',
    'Mühlheim am Main',
    '63165',
    50.1235352,
    8.8277042,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 243: DRK Kleiderladen | Neu-Isenburg
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen | Neu-Isenburg',
    '',
    'Bahnhofstraße 23',
    'Neu-Isenburg',
    '63263',
    50.0532722,
    8.6929416,
    NULL,
    '+49 6102 8827857',
    NULL,
    NULL,
    'Mo-Fr 10:00-12:00,15:00-17:00,  Sa 09:30-11:30',
    'Mo-Fr 10:00-12:00,15:00-17:00; Sa 09:30-11:30',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 244: DRK Kleiderladen | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'DRK Kleiderladen | Offenbach',
    '',
    'Frankfurter Straße 10',
    'Offenbach am Main',
    '63065',
    50.104706,
    8.7634731,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 245: Oxfam Buchshop | Darmstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Buchshop | Darmstadt',
    '',
    'Schulstraße 16',
    'Darmstadt',
    '64283',
    49.8706914,
    8.6562983,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 246: Oxfam Shop | Darmstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Shop | Darmstadt',
    '',
    'Rheinstraße 12b',
    'Darmstadt',
    '64283',
    49.8723745,
    8.6492698,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 247: Oxfam Shop | Mainz
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Shop | Mainz',
    '',
    'Graben 2',
    'Mainz',
    '55116',
    49.995726,
    8.276766,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 248: Oxfam Shop | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Oxfam Shop | Wiesbaden',
    '',
    'Dotzheimer Straße 19',
    'Wiesbaden',
    '65185',
    50.0788282,
    8.2339284,
    'https://shops.oxfam.de/shops/wiesbaden',
    NULL,
    NULL,
    NULL,
    'Mo-Fr 10:00-18:00, Sa 10:00-14:00',
    'Mo-Fr 10:00-18:00, Sa 10:00-14:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 249: ReSales | Darmstadt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'ReSales | Darmstadt',
    '',
    'Ludwigstraße 7',
    'Darmstadt',
    '64283',
    49.871612,
    8.6549226,
    'https://www.resales.de/secondhand-stores/hessen/darmstadt.html',
    NULL,
    NULL,
    NULL,
    'Mo-Sa 10:00-19:00,  So,Feiertage geschlossen',
    'Mo-Sa 10:00-19:00; Su,PH off',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 250: ReSales | Offenbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'ReSales | Offenbach',
    '',
    'Kaiserstraße 22-24',
    'Offenbach am Main',
    '63065',
    50.10269,
    8.75918999999999,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 10:00-19:00',
    'Mo-Sa 10:00-19:00',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 251: ReSales | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'ReSales | Wiesbaden',
    '',
    'Ellenbogengasse 6',
    'Wiesbaden',
    '65183',
    50.0815727,
    8.2407412,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 252: Vintage Factory1977 | Kelsterbach
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Vintage Factory1977 | Kelsterbach',
    '',
    'Am Südpark 12',
    'Kelsterbach',
    '65451',
    50.048973,
    8.5332044,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 253: Vintage Revivals | Wiesbaden
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Vintage Revivals | Wiesbaden',
    '',
    'Luisenstraße',
    'Wiesbaden',
    '65185',
    50.079249,
    8.24406,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Sa 11:00-19:00',
    'Mo-Sa 11:00-19:00',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_second_hand_id);
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_nachhaltige_mode_id);

  -- Location 254: Alter Flugplatz in Frankfurt-Bonames
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Alter Flugplatz in Frankfurt-Bonames',
    'Landschaftsschutzgebiet mit Feuerwehrmuseum, BIenenmuseum und Café. Im Juni findet der alljährliche Handmade Markt im Grünen statt.',
    '',
    'Frankfurt am Main',
    '60437',
    50.1773416,
    8.65711690000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 255: Bücherschrank
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Bücherschrank',
    'Am Merianplatz wurde 2009 der erste "Offene Bücherschrank" aufgestellt. Heute gibt es über 70 Bücherschränke im ganze Stadtgebiet. Eine Übersicht gibt es hier: https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke',
    'Kantstraße 28',
    'Frankfurt am Main',
    '60316',
    50.1204683,
    8.696307,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 256: Come on Closet
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Come on Closet',
    'Nachhaltige Stilberatung in Frankfurt. Weitere Infos zum Angebot und zur Terminvereinbarung findest du unter www.comeoncloset.de',
    'Eichwaldstraße 77',
    'Frankfurt am Main',
    '60389',
    50.1272038,
    8.7003313,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 257: Einzigware Frankfurt / Cariteam
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Einzigware Frankfurt / Cariteam',
    'Werksverkauf jeden 1. Donnerstag im Monat von 14-17 Uhr. EiNZIGWARE® ist die Upcycling-Marke von Beschäftigungsbetrieben der Caritas in ganz Deutschland. Aktuell gehören rund 25 Standorte zur Marke EiNZIGWARE® EiNZIGWARE macht aus entbehrlichen Klamotten unentbehrliche Lieblingskleidung, aus alten Möbeln neue Mitbewohner und aus einer ganzen Menge Sachen richtig tolle Dinge. EiNZIGWARE gibt Gegenständen neues Leben und Menschen neue Chancen. Von der Kleidersammlung über die Werkbank zur Webseite und auf den Laufsteg – EiNZIGWARE ist eine Bewegung. Die Richtung ist dabei immer klar und auch die Richtlinien: ökologisch,, kreativ, sozial. EiNZIGWARE ist aus wiederverwerteten Materialien, die Umweltbewusstsein haben. Aus Ideen, die robust sind. Und von Menschen gemacht, die erstklassige Arbeit leisten, dies aber nicht auf dem ersten Arbeitsmarkt tun können. Mehr Infos hier: http://www.einzigware.de/ https://www.zerowastefrankfurt.de/ulf-der-neue-unverpackt-laden-in-der-frankfurter-altstadt/',
    'Eichenstraße 74',
    'Frankfurt am Main',
    '65933',
    50.09565,
    8.59726,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 258: Fairteiler Bornheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Fairteiler Bornheim',
    'Dieser Fairteiler ist ein Umschlagplatz für noch genießbare Lebensmittel. Mehr Infos dazu: https://foodsharing.de/?page=fairteiler&bid=28&sub=ft&id=1879',
    'Berger Straße 135',
    'Frankfurt am Main',
    '60385',
    50.12422,
    8.70359,
    NULL,
    NULL,
    NULL,
    NULL,
    'Mo-Fr 10:30-18:30,  Sa 10:30-17:30',
    'Mo-Fr 10:30-18:30; Sa 10:30-17:30',
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 259: Fairteiler im IZ Frankfurt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Fairteiler im IZ Frankfurt',
    'In diesem Fair-Teiler können Lebensmittel geteilt und auch kostenlos entnommen werden. Sie haben oft das Mindesthaltbarkeitsdatum überschritten, sind aber durchaus noch genießbar. Mehr Infos und aktuelle Öffnungszeiten hier: http://iz-ffm.de/?p=1868',
    'Koblenzer Straße 17',
    'Frankfurt am Main',
    '60327',
    50.1067023,
    8.6472803,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 260: FoodCoop KlaaKarott e.V.
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'FoodCoop KlaaKarott e.V.',
    'Einkaufsgemeinschaft in Heddernheim, nur für Mitglieder. Hier werden regionale, umweltgerecht erzeugte Lebensmittel so verpackungsarm wie möglich direkt von den Produzent*innen gekauft und an die Vereinsmitglieder ohne Aufschlag weitergegeben. Mehr Infos dazu: https://klaakarott.jimdofree.com/',
    'Nassauer Straße 9',
    'Frankfurt am Main',
    '60439',
    50.1606826,
    8.6474916,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 261: Hotel Villa Orange
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Hotel Villa Orange',
    'Frankfurts erstes und einziges Bio-Hotel. Mehr Infos dazu: https://www.instagram.com/p/BwsB1L8ncea/',
    'Hebelstraße 1',
    'Frankfurt am Main',
    '60318',
    50.1208991,
    8.68944759999999,
    'https://www.villa-orange.de/',
    '+49 69 405840',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 262: Mainova Trinkbrunnen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Mainova Trinkbrunnen',
    '',
    'Große Bockenheimer Straße',
    'Frankfurt am Main',
    '60313',
    50.1136498,
    8.68049159999998,
    NULL,
    NULL,
    NULL,
    NULL,
    'Täglich 24 Stunden',
    '24/7',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 263: Mainova Trinkbrunnen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Mainova Trinkbrunnen',
    '',
    'Große Bockenheimer Straße',
    'Frankfurt am Main',
    '60313',
    50.1147236,
    8.67364399999997,
    NULL,
    NULL,
    NULL,
    NULL,
    'Täglich 24 Stunden',
    '24/7',
    NULL,
    '{"wheelchair":true}'::jsonb,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 264: Nachhaltig Guide
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Nachhaltig Guide',
    '',
    'Passavantstraße 35',
    'Frankfurt am Main',
    '60596',
    50.0975847,
    8.67394590000004,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 265: Neuer Frankfurter Garten
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Neuer Frankfurter Garten',
    '',
    '8',
    'Frankfurt am Main',
    '60385',
    50.1131578,
    8.70716149999998,
    'https://www.neuerfrankfurtergarten.de/',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 266: Sachen auf Rädern
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Sachen auf Rädern',
    '',
    'Saalburgstraße 13',
    'Frankfurt am Main',
    '60385',
    50.1259268,
    8.70877459999997,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 267: Windelfrei Frankfurt
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Windelfrei Frankfurt',
    'Windelfrei Frankfurt bietet Kurse und regelmäßige Treffen zum Austausch über die Themen Windelfrei und sauber werden an. Nein, Windelfrei bedeutet nicht, dass das Baby zwangsläufig ohne Windel ist. Hier lernen Eltern, die Signale ihres Babys zu verstehen, damit sie es abhalten können, von Geburt an. Spannendes Thema... und es funktioniert tatsächlich! Das ist keine Geschäftsadresse, mehr Infos auf der Website.',
    'Günthersburgallee 14',
    'Frankfurt am Main',
    '60316',
    50.1237599,
    8.69392010000001,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 268: Die Windelzwerge
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Die Windelzwerge',
    'Die Windelzwerge bieten einen Leih-, Wasch- und Lieferservice für Stoffwindeln im Rhein-Main-Gebiet. Weitere Infos zum Angebot inklusive des Liefergebiets findest du unter www.diewindelzwerge.de',
    'Altkönigstraße 10',
    'Oberursel (Taunus)',
    '61440',
    50.2017259,
    8.5736476,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_andere_id);

  -- Location 269: Repair Café Bockenheim
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Repair Café Bockenheim',
    '',
    'Mertonstraße 26-28',
    'Frankfurt am Main',
    '60325',
    50.118603,
    8.65155100000004,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_repair_cafes_id);

  -- Location 270: Repair Café Sachsenhausen
  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)
  VALUES (
    'Repair Café Sachsenhausen',
    'Jeden 1. Dienstag im Monat von 17:30 bis 20 Uhr im Gemeindehaus Sankt Wendel (Kellergeschoss). Reparaturanmeldungen sind bis 19 Uhr möglich. Repariert werden Elektrogeräte, Computer (Hardware, Software, Viren- und Trojaner-Infektionen), Fahrräder, Textilien sowie Holzobjekte, Metallobjekte, mechanische Geräte, Modeschmuck und Gitarren.',
    'Altes Schützenhüttengäßchen 4',
    'Frankfurt am Main',
    '60599',
    50.092,
    8.69376,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'approved'
  ) RETURNING id INTO loc_id;
  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, cat_repair_cafes_id);

END $$;

-- Migration complete: 270 locations imported