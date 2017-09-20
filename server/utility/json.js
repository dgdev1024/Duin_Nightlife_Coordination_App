///
/// @file   json.js
/// @brief  Function to safely parse and stringify JSON with no exceptions.
///

module.exports = {
    safeParse (str) {
        try {
            return JSON.parse(str);
        }
        catch (err) {
            console.error(`JSON.safeParse: ${err}`);
            return null;
        }
    }
}