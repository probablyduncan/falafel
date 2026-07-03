// console.log(process.env)
console.log("heyyy")
console.log("service:", process.env.ATPROTO_SERVICE?.replaceAll("https", ""))
console.log("is it equal to hardcoded val?", process.env.ATPROTO_SERVICE === "https://bsky.social")
console.log("hardcoded", "https://bsky.social");