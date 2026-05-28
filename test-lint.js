// test-lint.js
const { Category, Recipe } = require("./models/index");

// async function test() {
//   const recipes = await Recipe.findAll({
//     //   where: {
//     //     userId: user.userId,
//     //   },
//     include: [{ model: Category }],
//   });
//   return recipes;
// }

// test()
//   .then((recipes) => {
//     console.log(JSON.stringify(recipes, null, 2));
//     const categories = recipes.flatMap((recipe) => recipe.Categories);
//     console.log(categories);
//   })
//   .catch((err) => console.error(err));

function test(callback, callback2) {
  Recipe.findAll({
    //     //   where: {
    //     //     userId: user.userId,
    //     //   },
    include: [{ model: Category }],
  })
    .then((recipes) => {
      callback(null, recipes);
      callback2(recipes);
    })
    .catch((err) => callback(err, null));
}

test(
  (err, result) => {
    if (err) console.log(err);
    console.log(JSON.stringify(result, null, 2));
  },
  (result2) => {
    const categories = result2.flatMap((recipe) => recipe.Categories);
    console.log(categories);
  },
);

// const unused = "hello"; // should warn (no-unused-vars)
// console.log(somethingUndefined); // should error (no-undef)

// console.log(process.env.DB_NAME);
