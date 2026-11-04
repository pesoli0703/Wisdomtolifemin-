-- ============================================================
-- WISDOM TO LIFE MINISTRY — Seed data
-- Everything marked with [ ] brackets is an editable placeholder.
-- Update it from the Admin Dashboard → Site Content.
-- ============================================================

-- ------------------------------------------------------------
-- Site settings
-- ------------------------------------------------------------
insert into public.wtlm_settings (key, value) values
(
  'site_identity',
  '{
    "name": "Wisdom To Life Ministry",
    "short_name": "WTLM",
    "tagline": "God''s wisdom. Real life. Lasting transformation.",
    "welcome_headline": "Welcome Home — Where Wisdom Meets Life",
    "welcome_subheadline": "A place of faith, hope and transformation. Come as you are and discover the life-changing wisdom of God with a warm family of believers.",
    "intro": "Wisdom To Life Ministry is a Bible-believing Christian ministry dedicated to helping people discover, receive and apply God''s wisdom to everyday life — in their families, work, studies and walk with Christ."
  }'::jsonb
),
(
  'contact_info',
  '{
    "email": "Wisdomtolifemin@gmail.com",
    "phone": "[Add church phone number]",
    "whatsapp": "[Add WhatsApp number]",
    "address": "[Add church physical address]",
    "city": "[Add city / state]",
    "maps_url": "[Add Google Maps link to church location]"
  }'::jsonb
),
(
  'social_links',
  '{
    "facebook": "",
    "instagram": "",
    "youtube": "",
    "x": "",
    "tiktok": ""
  }'::jsonb
),
(
  'pastor_welcome',
  '{
    "name": "[Add Senior Pastor''s name]",
    "title": "Senior Pastor",
    "photo_url": "/images/pastor-welcome.jpg",
    "message": "[Add the pastor''s welcome message here. Example structure: a warm greeting to visitors, a short word about what God is doing in the ministry, and an invitation to join a service. Edit this from the Admin Dashboard under Site Content.]",
    "signature": "In His service"
  }'::jsonb
),
(
  'vision_mission',
  '{
    "vision": "To raise a generation of people whose lives are transformed by the wisdom of God — walking in faith, love and purpose in every area of life.",
    "mission": "We exist to preach the unchanging Word of God, disciple believers into maturity, serve our community with the love of Christ, and demonstrate that God''s wisdom is practical for everyday life.",
    "objectives": [
      "To teach the Bible clearly so that visitors and members can apply God''s wisdom daily.",
      "To build a warm, welcoming community where every person is known and cared for.",
      "To raise and equip leaders for the ministry and the marketplace.",
      "To reach the lost through evangelism, outreach and acts of compassion.",
      "To pray consistently for members, the community and the nations."
    ]
  }'::jsonb
),
(
  'about_content',
  '{
    "history": "[Add the history of the ministry here — when it was founded, how it began, key milestones and seasons of growth. This text is editable from the Admin Dashboard under Site Content.]",
    "statement_of_faith": [
      "[Add ministry statement of faith — e.g. beliefs about the Bible, the Trinity, salvation, the Church and the return of Christ. Editable from the Admin Dashboard.]"
    ],
    "core_values": [
      {"title": "The Word of God", "description": "The Bible is our final authority for faith, conduct and ministry."},
      {"title": "Prayer", "description": "We depend on God and seek His face in every season."},
      {"title": "Love & Family", "description": "We welcome everyone as Christ welcomed us and grow as one family."},
      {"title": "Wisdom in Practice", "description": "We believe God''s wisdom must be lived out at home, at work and in the community."},
      {"title": "Integrity", "description": "We serve with honesty, accountability and transparency before God and people."},
      {"title": "Excellence", "description": "We give our best to God in worship, ministry and stewardship."}
    ]
  }'::jsonb
),
(
  'hero_content',
  '{
    "image_url": "/images/hero-worship.jpg",
    "scripture": "Wisdom is the principal thing; therefore get wisdom — Proverbs 4:7 (KJV)"
  }'::jsonb
),
(
  'giving_content',
  '{
    "intro": "Your giving supports the work of the ministry — outreach, church programmes, the building project and caring for people in need. Every gift is received with gratitude and stewarded with integrity.",
    "note": "Online giving is processed securely via Flutterwave. [Add bank account details here for manual transfers — editable from the Admin Dashboard.]"
  }'::jsonb
)
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Ministries / departments
-- ------------------------------------------------------------
insert into public.wtlm_ministries (slug, name, tagline, description, icon, meeting_day, meeting_time, sort_order) values
('childrens-ministry', 'Children''s Ministry', 'Raising a generation that knows God early',
 'A safe, joyful environment where children learn the Word of God through creative teaching, worship, Bible memory and fun activities tailored to their age groups.',
 'children', '[Add day]', '[Add time]', 1),
('youth-ministry', 'Youth Ministry', 'Faith, purpose and fire for the next generation',
 'Empowering teenagers and young adults to live wisely in today''s world through dynamic worship, relevant Bible teaching, mentorship and fellowship activities.',
 'youth', '[Add day]', '[Add time]', 2),
('womens-ministry', 'Women''s Ministry', 'Women of wisdom, strength and grace',
 'Building up women in faith, character and purpose through Bible study, mentorship, retreats and outreach, so that every woman thrives in her God-given role.',
 'women', '[Add day]', '[Add time]', 3),
('mens-ministry', 'Men''s Ministry', 'Men of valour, integrity and wisdom',
 'Equipping men to lead their homes, workplaces and the church with godly character through fellowship, accountability, Bible study and mentorship programmes.',
 'men', '[Add day]', '[Add time]', 4),
('worship-choir', 'Worship & Choir', 'Lifting the name of Jesus with excellence',
 'The music and worship arm of the ministry — a team of vocalists and instrumentalists dedicated to leading the congregation into God''s presence with skill and heart.',
 'worship', '[Add rehearsal day]', '[Add time]', 5),
('evangelism-outreach', 'Evangelism & Outreach', 'Taking the good news beyond the walls',
 'Organising street evangelism, community outreach, hospital and prison visits, and mission programmes to reach the lost and serve the needy with the love of Christ.',
 'outreach', '[Add day]', '[Add time]', 6),
('prayer-ministry', 'Prayer Ministry', 'A house of prayer for all nations',
 'Coordinating the prayer life of the ministry — prayer meetings, intercession for members and the nations, counselling prayer support and the 24/7 prayer chain.',
 'prayer', '[Add day]', '[Add time]', 7)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Service times (placeholders — confirm before publishing)
-- ------------------------------------------------------------
insert into public.wtlm_service_times (service_name, day_of_week, start_time, end_time, description, sort_order, published) values
('Sunday Worship Service', 'Sunday', '[Confirm time]', '', 'Main weekly worship and Word service. [Confirm schedule in Admin Dashboard]', 1, true),
('Midweek Service', '[Confirm day]', '[Confirm time]', '', 'Midweek Bible teaching and worship. [Confirm schedule in Admin Dashboard]', 2, true),
('Prayer Meeting', '[Confirm day]', '[Confirm time]', '', 'Corporate prayer and intercession. [Confirm schedule in Admin Dashboard]', 3, true)
;

-- ------------------------------------------------------------
-- A starter announcement for admins
-- ------------------------------------------------------------
insert into public.wtlm_announcements (title, body, published) values
('Welcome to the new Wisdom To Life Ministry website',
 'This website is now live. Church administrators: log in to the Admin Dashboard to add service times, sermons, events, gallery photos and update all placeholder content marked with [ ] brackets.',
 true);
