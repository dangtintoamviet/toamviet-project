(function () {
    "use strict";

    const STORAGE_KEYS = {
        currentUser: "currentUser",
        registeredUser: "registeredUser",
        allPosts: "allPosts",
        propertyPosts: "propertyPosts",
        salePosts: "salePosts",
        rentalPosts: "rentalPosts",
        constructionPosts: "constructionPosts",
        projects: "projects"
    };

    function safeParse(json, fallback) {
        try {
            return JSON.parse(json);
        } catch (error) {
            return fallback;
        }
    }

    function getItem(key, fallback = null) {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === undefined || raw === "") {
            return fallback;
        }
        return safeParse(raw, fallback);
    }

    function setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function removeItem(key) {
        localStorage.removeItem(key);
    }

    function getCurrentUser() {
        return (
            getItem(STORAGE_KEYS.currentUser, null) ||
            getItem(STORAGE_KEYS.registeredUser, null) ||
            null
        );
    }

    function saveCurrentUser(userData) {
        if (!userData || typeof userData !== "object") {
            throw new Error("saveCurrentUser: userData không hợp lệ");
        }

        const nextUser = {
            ...userData,
            updatedAt: new Date().toISOString()
        };

        setItem(STORAGE_KEYS.currentUser, nextUser);
        setItem(STORAGE_KEYS.registeredUser, nextUser);

        return nextUser;
    }

    function clearCurrentUser() {
        removeItem(STORAGE_KEYS.currentUser);
    }

    function getAllPosts() {
        return getItem(STORAGE_KEYS.allPosts, []);
    }

    function saveAllPosts(posts) {
        if (!Array.isArray(posts)) {
            throw new Error("saveAllPosts: posts phải là mảng");
        }

        setItem(STORAGE_KEYS.allPosts, posts);
        syncDerivedPostStores(posts);

        return posts;
    }

    function getProjects() {
        return getItem(STORAGE_KEYS.projects, []);
    }

    function saveProjects(projects) {
        if (!Array.isArray(projects)) {
            throw new Error("saveProjects: projects phải là mảng");
        }

        setItem(STORAGE_KEYS.projects, projects);
        return projects;
    }

    function syncDerivedPostStores(sourcePosts) {
        const posts = Array.isArray(sourcePosts) ? sourcePosts : getAllPosts();

        const propertyPosts = posts.filter((post) => post && post.flow === "real_estate");
        const salePosts = propertyPosts.filter((post) => post && post.postType === "ban");
        const rentalPosts = propertyPosts.filter((post) => post && post.postType === "thue");
        const constructionPosts = posts.filter((post) => post && post.flow === "construction");

        setItem(STORAGE_KEYS.propertyPosts, propertyPosts);
        setItem(STORAGE_KEYS.salePosts, salePosts);
        setItem(STORAGE_KEYS.rentalPosts, rentalPosts);
        setItem(STORAGE_KEYS.constructionPosts, constructionPosts);

        return {
            propertyPosts,
            salePosts,
            rentalPosts,
            constructionPosts
        };
    }

    function addPost(newPost) {
        if (!newPost || typeof newPost !== "object") {
            throw new Error("addPost: newPost không hợp lệ");
        }

        const posts = getAllPosts();
        posts.unshift(newPost);
        saveAllPosts(posts);
        return newPost;
    }

    function updatePost(postId, updatedData) {
        if (!postId) {
            throw new Error("updatePost: thiếu postId");
        }

        const posts = getAllPosts();
        const index = posts.findIndex((post) => post && post.id === postId);

        if (index === -1) {
            return null;
        }

        posts[index] = {
            ...posts[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };

        saveAllPosts(posts);
        return posts[index];
    }

    function deletePost(postId) {
        if (!postId) {
            throw new Error("deletePost: thiếu postId");
        }

        const posts = getAllPosts();
        const nextPosts = posts.filter((post) => post && post.id !== postId);
        saveAllPosts(nextPosts);

        return true;
    }

    function getPostById(postId) {
        if (!postId) return null;
        return getAllPosts().find((post) => post && post.id === postId) || null;
    }

    function getMyPosts(user) {
        const currentUser = user || getCurrentUser();
        const posts = getAllPosts();

        if (!currentUser) return [];

        return posts.filter((post) => {
            if (!post) return false;

            if (currentUser.id && post.userId) {
                return post.userId === currentUser.id;
            }

            const sameEmail =
                currentUser.email &&
                post.email &&
                String(currentUser.email).trim().toLowerCase() === String(post.email).trim().toLowerCase();

            const samePhone =
                currentUser.phone &&
                post.phone &&
                String(currentUser.phone).replace(/\D/g, "") === String(post.phone).replace(/\D/g, "");

            return sameEmail || samePhone;
        });
    }

    function clearAllPostStores() {
        removeItem(STORAGE_KEYS.allPosts);
        removeItem(STORAGE_KEYS.propertyPosts);
        removeItem(STORAGE_KEYS.salePosts);
        removeItem(STORAGE_KEYS.rentalPosts);
        removeItem(STORAGE_KEYS.constructionPosts);
    }

    function getStorageSummary() {
        const allPosts = getAllPosts();
        const projects = getProjects();

        return {
            currentUser: getCurrentUser(),
            totalPosts: allPosts.length,
            totalProjects: projects.length,
            derived: {
                propertyPosts: getItem(STORAGE_KEYS.propertyPosts, []).length,
                salePosts: getItem(STORAGE_KEYS.salePosts, []).length,
                rentalPosts: getItem(STORAGE_KEYS.rentalPosts, []).length,
                constructionPosts: getItem(STORAGE_KEYS.constructionPosts, []).length
            }
        };
    }

    window.userStorage = {
        STORAGE_KEYS,
        getItem,
        setItem,
        removeItem,

        getCurrentUser,
        saveCurrentUser,
        clearCurrentUser,

        getAllPosts,
        saveAllPosts,
        getProjects,
        saveProjects,

        syncDerivedPostStores,

        addPost,
        updatePost,
        deletePost,
        getPostById,
        getMyPosts,

        clearAllPostStores,
        getStorageSummary
    };
})();
