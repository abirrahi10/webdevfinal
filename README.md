# Abir Rahi Final

To access the project, please clone or download zip file from this repo. <br />
Then run "npm install." <br />
Lastly, run "npm run start"
<br>
<br>
If you receive an (Error: dlopen), please run "rm -rf node_modules/" followed by "npm update" and "npm install" <br />
Also please make sure you are on node version v20 or above.
<br>
<br>
Please make sure to create the database locally. Name it "mimi_recipes" with username "postgres", password "1234" and make sure it connects to port "5432" <br />
Then run these sql queries: <br />

```
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```
```
CREATE TABLE saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    recipe_title VARCHAR(255) NOT NULL,
    recipe_image TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);
```
