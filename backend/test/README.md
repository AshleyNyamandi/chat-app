# Message integration tests

With backend dependencies installed and a local MongoDB server running:

```sh
TEST_MONGO_URI=mongodb://127.0.0.1:27017 npm test
```

The suite creates a uniquely named database and drops only that database after testing. It exercises real HTTP routes, MongoDB persistence, chat partner discovery, conversation isolation, and authenticated Socket.IO delivery. Supabase image uploads are outside this suite.
