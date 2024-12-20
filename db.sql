CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    recipe_title VARCHAR(255) NOT NULL,
    recipe_image TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);
