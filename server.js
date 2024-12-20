const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const app = express();
const PORT = 3000;

//connect to db
const db = new Client({
    user: "postgres",
    host: "127.0.0.1",
    database: "mimi_recipes",
    password: "1234",
    port: 5432,
});
db.connect();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'mimi', 
    resave: false,            
    saveUninitialized: false, 
    cookie: { secure: false } 
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//sets userId globally
app.use((req, res, next) => {
    res.locals.userId = req.session.userId || null;
    next();
});

// load home page
app.get('/', (req, res) => {
    res.render('index'); 
});

//load login page
app.get('/login', (req, res) => {
    res.render('login');
});

//check login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).send('No user found with this email.');
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).send('Invalid password.');
        }

        req.session.userId = user.user_id;
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Login error');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Registering new account
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id',
            [email, hashedPassword]
        );

        res.redirect('/login');
    } catch (error) {
        if (error.code === '23505') {
            console.error(error);
            return res.status(400).send('User already exists. Please log in.');
        }
        console.error(error);
    }
});

// Pull saved recipes from database
app.get('/saved', async (req, res) => {
    if (!req.session.userId) {
        return res.render('recipes', { savedRecipes: [] });
    }

    try {
        const result = await db.query(
            'SELECT recipe_id, recipe_title, recipe_image FROM saved_recipes WHERE user_id = $1',
            [req.session.userId]
        );

        res.render('recipes', { savedRecipes: result.rows });
    } catch (error) {
        console.error(error);
        res.render('recipes', { savedRecipes: [] });
    }
});

//push recipe to database
app.post('/save-recipe', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401)
    }

    const { recipeId, recipeTitle, recipeImage } = req.body;

    if (!recipeId || !recipeTitle) {
        return res.status(400)
    }

    try {
        // save recipe to  database
        const result = await db.query(
            `INSERT INTO saved_recipes (user_id, recipe_id, recipe_title, recipe_image) 
             VALUES ($1, $2, $3, $4) `,
            [req.session.userId, recipeId, recipeTitle, recipeImage]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ 
                success: true, 
                message: 'Recipe saved successfully' 
            });
        } else {
            res.status(200).json({ 
                success: false, 
                message: 'Recipe already saved' 
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500)
    }
});

// search for items using api
app.get('/search', async (req, res) => {
    const query = req.query.query || '';

    if (!query) {
        return res.render('search', {
            query: '',
            recipes: [],
        });
    }

    try {
        const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
            params: {
                apiKey: "4d05800a81ce403dbeee3b95f46a8325",
                query: query,
                number: 15, // Limit to 15 results
            },
        });

        res.render('search', {
            query: query,
            recipes: response.data.results,
        });
    } catch (error) {
        console.error('API Error:', error);
        res.render('search', {
            query: query,
            recipes: [],
            error: 'Failed to fetch recipes',
        });
    }
});

app.get('/recipe/:id', async (req, res) => {
    const recipeId = req.params.id;

    try {
        const recipeInfoResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${recipeId}/information`,
            {
                params: {
                    apiKey: "4d05800a81ce403dbeee3b95f46a8325",
                    includeNutrition: true,
                },
            }
        );

        const recipeNutritionResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json`,
            {
                params: {
                    apiKey: "4d05800a81ce403dbeee3b95f46a8325",
                },
            }
        );

        const recipeInfo = recipeInfoResponse.data;
        const nutritionInfo = recipeNutritionResponse.data;

        res.render('recipe-details', {
            recipe: recipeInfo,
            nutrition: nutritionInfo,
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Failed to fetch recipe details',
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
