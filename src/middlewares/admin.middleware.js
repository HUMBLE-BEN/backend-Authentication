


const authorizeAdmin = async (req, res, next) => {
    if (!req.user || req.role !== "admin ") {

        return res.status(401).json({
            success: false,
            Message: "Access  denied Administrator priviage are require for this action",

        })
    }
    next()
}


module.exports = authorizeAdmin