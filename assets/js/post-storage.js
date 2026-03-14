(function () {
    "use strict";

    function ensureUserStorage() {
        if (!window.userStorage) {
            throw new Error("postStorage cần userStorage.js được load trước");
        }
    }

    function getAllPosts() {
        ensureUserStorage();
        return window.userStorage.getAllPosts();
    }

    function saveAllPosts(posts) {
        ensureUserStorage();
        return window.userStorage.saveAllPosts(posts);
    }

    function getSalePosts() {
        return getAllPosts().filter((post) => post && post.flow === "real_estate" && post.postType === "ban");
    }

    function getRentalPosts() {
        return getAllPosts().filter((post) => post && post.flow === "real_estate" && post.postType === "thue");
    }

    function getConstructionPosts() {
        return getAllPosts().filter((post) => post && post.flow === "construction");
    }

    function getPostsByProjectSlug(projectSlug) {
        if (!projectSlug) return [];
        return getAllPosts().filter((post) => post && post.projectSlug === projectSlug);
    }

    function getPostsByUser(user) {
        ensureUserStorage();
        return window.userStorage.getMyPosts(user);
    }

    function getPostById(postId) {
        ensureUserStorage();
        return window.userStorage.getPostById(postId);
    }

    function createPost(postData) {
        ensureUserStorage();

        if (!postData || typeof postData !== "object") {
            throw new Error("createPost: postData không hợp lệ");
        }

        const nextPost = {
            ...postData,
            id: postData.id || "post_" + Date.now(),
            status: postData.status || "pending",
            createdAt: postData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        window.userStorage.addPost(nextPost);
        return nextPost;
    }

    function updatePost(postId, updatedData) {
        ensureUserStorage();
        return window.userStorage.updatePost(postId, updatedData || {});
    }

    function deletePost(postId) {
        ensureUserStorage();
        return window.userStorage.deletePost(postId);
    }

    function duplicatePost(postId) {
        const original = getPostById(postId);
        if (!original) return null;

        const copy = {
            ...original,
            id: "post_" + Date.now(),
            slug: (original.slug || "tin-dang") + "-copy-" + Date.now(),
            title: (original.title || "Tin đăng") + " - Bản sao",
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        createPost(copy);
        return copy;
    }

    function togglePostStatus(postId, nextStatus) {
        return updatePost(postId, {
            status: nextStatus,
            updatedAt: new Date().toISOString()
        });
    }

    function getPostStats(postsInput) {
        const posts = Array.isArray(postsInput) ? postsInput : getAllPosts();

        return {
            total: posts.length,
            pending: posts.filter((p) => (p.status || "pending") === "pending").length,
            approved: posts.filter((p) => p.status === "approved").length,
            rejected: posts.filter((p) => p.status === "rejected").length,
            hidden: posts.filter((p) => p.status === "hidden").length,
            sale: posts.filter((p) => p.flow === "real_estate" && p.postType === "ban").length,
            rental: posts.filter((p) => p.flow === "real_estate" && p.postType === "thue").length,
            construction: posts.filter((p) => p.flow === "construction").length,
            withProject: posts.filter((p) => p.projectSlug || p.projectName).length
        };
    }

    function getAverageSalePriceByProject(projectSlug) {
        const salePosts = getPostsByProjectSlug(projectSlug).filter(
            (post) =>
                post &&
                post.flow === "real_estate" &&
                post.postType === "ban" &&
                typeof post.pricePerSquareMeter === "number" &&
                post.pricePerSquareMeter > 0
        );

        if (!salePosts.length) return null;

        const total = salePosts.reduce((sum, post) => sum + post.pricePerSquareMeter, 0);
        return Math.round(total / salePosts.length);
    }

    window.postStorage = {
        getAllPosts,
        saveAllPosts,
        getSalePosts,
        getRentalPosts,
        getConstructionPosts,
        getPostsByProjectSlug,
        getPostsByUser,
        getPostById,
        createPost,
        updatePost,
        deletePost,
        duplicatePost,
        togglePostStatus,
        getPostStats,
        getAverageSalePriceByProject
    };
})();
