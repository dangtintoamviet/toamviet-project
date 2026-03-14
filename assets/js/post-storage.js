(function () {
    "use strict";

    function ensureUserStorage() {
        if (!window.userStorage) {
            throw new Error("postStorage cần userStorage.js được load trước");
        }
    }

    function ensureProjectService() {
        return !!window.projectService;
    }

    function syncDerivedStores(posts) {
        ensureUserStorage();

        const safePosts = Array.isArray(posts) ? posts : getAllPosts();

        if (typeof window.userStorage.syncDerivedPostStores === "function") {
            window.userStorage.syncDerivedPostStores(safePosts);
        } else {
            const propertyPosts = safePosts.filter((post) => post && post.flow === "real_estate");
            const salePosts = propertyPosts.filter((post) => post && post.postType === "ban");
            const rentalPosts = propertyPosts.filter((post) => post && post.postType === "thue");
            const constructionPosts = safePosts.filter((post) => post && post.flow === "construction");

            localStorage.setItem("propertyPosts", JSON.stringify(propertyPosts));
            localStorage.setItem("salePosts", JSON.stringify(salePosts));
            localStorage.setItem("rentalPosts", JSON.stringify(rentalPosts));
            localStorage.setItem("constructionPosts", JSON.stringify(constructionPosts));
        }

        if (ensureProjectService() && typeof window.projectService.syncProjectCounts === "function") {
            window.projectService.syncProjectCounts(safePosts);
        }

        return safePosts;
    }

    function getAllPosts() {
        ensureUserStorage();
        return window.userStorage.getAllPosts();
    }

    function saveAllPosts(posts) {
        ensureUserStorage();
        const safePosts = Array.isArray(posts) ? posts : [];
        window.userStorage.saveAllPosts(safePosts);
        syncDerivedStores(safePosts);
        return safePosts;
    }

    function filterPostsByStatus(posts, status) {
        if (!status) return posts;
        return posts.filter((post) => post && (post.status || "pending") === status);
    }

    function getSalePosts(status) {
        const posts = getAllPosts().filter(
            (post) => post && post.flow === "real_estate" && post.postType === "ban"
        );
        return filterPostsByStatus(posts, status);
    }

    function getRentalPosts(status) {
        const posts = getAllPosts().filter(
            (post) => post && post.flow === "real_estate" && post.postType === "thue"
        );
        return filterPostsByStatus(posts, status);
    }

    function getConstructionPosts(status) {
        const posts = getAllPosts().filter(
            (post) => post && post.flow === "construction"
        );
        return filterPostsByStatus(posts, status);
    }

    function getPostsByProjectSlug(projectSlug, status) {
        if (!projectSlug) return [];
        const posts = getAllPosts().filter(
            (post) => post && post.projectSlug === projectSlug
        );
        return filterPostsByStatus(posts, status);
    }

    function getPostsByUser(user) {
        ensureUserStorage();
        return window.userStorage.getMyPosts(user);
    }

    function getPostById(postId) {
        ensureUserStorage();
        return window.userStorage.getPostById(postId);
    }

    function getPostBySlug(slug) {
        if (!slug) return null;
        return getAllPosts().find((post) => post && post.slug === slug) || null;
    }

    function createPost(postData) {
        ensureUserStorage();

        if (!postData || typeof postData !== "object") {
            throw new Error("createPost: postData không hợp lệ");
        }

        const now = new Date().toISOString();

        const nextPost = {
            ...postData,
            id: postData.id || "post_" + Date.now(),
            status: postData.status || "pending",
            createdAt: postData.createdAt || now,
            updatedAt: now
        };

        window.userStorage.addPost(nextPost);
        syncDerivedStores();

        return nextPost;
    }

    function updatePost(postId, updatedData) {
        ensureUserStorage();

        if (!postId) {
            throw new Error("updatePost: thiếu postId");
        }

        const patchData = {
            ...(updatedData || {}),
            updatedAt: new Date().toISOString()
        };

        const result = window.userStorage.updatePost(postId, patchData);
        syncDerivedStores();

        return result;
    }

    function deletePost(postId) {
        ensureUserStorage();

        if (!postId) {
            throw new Error("deletePost: thiếu postId");
        }

        const result = window.userStorage.deletePost(postId);
        syncDerivedStores();

        return result;
    }

    function duplicatePost(postId) {
        const original = getPostById(postId);
        if (!original) return null;

        const timestamp = Date.now();

        const copy = {
            ...original,
            id: "post_" + timestamp,
            slug: (original.slug || "tin-dang") + "-copy-" + timestamp,
            title: (original.title || "Tin đăng") + " - Bản sao",
            status: "pending",
            approvedAt: "",
            rejectedAt: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return createPost(copy);
    }

    function togglePostStatus(postId, nextStatus) {
        if (!nextStatus) {
            throw new Error("togglePostStatus: thiếu nextStatus");
        }

        const patch = {
            status: nextStatus
        };

        if (nextStatus === "approved") {
            patch.approvedAt = new Date().toISOString();
            patch.rejectedAt = "";
        }

        if (nextStatus === "rejected") {
            patch.rejectedAt = new Date().toISOString();
        }

        return updatePost(postId, patch);
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

    function getAverageSalePriceByProject(projectSlug, approvedOnly) {
        const salePosts = getPostsByProjectSlug(
            projectSlug,
            approvedOnly ? "approved" : ""
        ).filter(
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
        syncDerivedStores,
        getSalePosts,
        getRentalPosts,
        getConstructionPosts,
        getPostsByProjectSlug,
        getPostsByUser,
        getPostById,
        getPostBySlug,
        createPost,
        updatePost,
        deletePost,
        duplicatePost,
        togglePostStatus,
        getPostStats,
        getAverageSalePriceByProject
    };
})();
