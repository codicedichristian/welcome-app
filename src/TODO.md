## Backend — things to implement

### Authentication
- [ ] Replace localStorage user storage with real backend registration
- [ ] POST /api/auth/register — save user (name, email, phone, age, interests, notifications)
- [ ] POST /api/auth/login — email or phone login
- [ ] JWT token stored in localStorage after login
- [ ] Protected routes redirect to login if no token
- [ ] Profile edit calls PATCH /api/users/:id

### Events
- [ ] GET /api/events — fetch real events from database
- [ ] POST /api/events/:id/rsvp — save RSVP to backend
- [ ] GET /api/events/my — fetch user's RSVPs

### Midweek
- [ ] GET /api/midweeks — fetch real midweek groups
- [ ] POST /api/midweeks/:id/rsvp — save midweek RSVP

### News
- [ ] GET /api/news — fetch announcements from database

### Notifications
- [ ] WhatsApp integration via Twilio or WhatsApp Business API
- [ ] Push notifications via Firebase Cloud Messaging
