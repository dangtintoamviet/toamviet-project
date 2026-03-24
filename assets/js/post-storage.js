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

    function normalizeText(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function slugify(str) {
        return String(str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }

    function normalizeStatus(status) {
        const raw = normalizeText(status);
        if (!raw) return "pending";

        if (raw === "approved") return "approved";
        if (raw === "rejected") return "rejected";
        if (raw === "hidden") return "hidden";
        if (raw === "demo") return "demo";
        if (raw === "pending") return "pending";
        if (raw === "published") return "approved";

        return "pending";
    }

    function normalizeFlow(flow) {
        const raw = normalizeText(flow);

        if (raw === "construction") return "construction";
        if (raw === "real_estate") return "real_estate";

        return "real_estate";
    }

    function normalizePostType(postType, flow) {
        const normalizedFlow = normalizeFlow(flow);
        const raw = normalizeText(postType);

        if (normalizedFlow === "construction") {
            return "xaydung";
        }

        if (raw === "ban" || raw === "sale") return "ban";
        if (raw === "thue" || raw === "cho-thue" || raw === "rent" || raw === "rental") return "thue";

        return "ban";
    }

    function normalizeVipLevel(vipLevel) {
        const raw = normalizeText(vipLevel);

        if (!raw) return "thuong";
        if (raw === "kim-cuong" || raw === "kimcuong" || raw === "diamond") return "kim-cuong";
        if (raw === "vang" || raw === "gold") return "vang";
        if (raw === "bac" || raw === "silver") return "bac";
        if (raw === "dong" || raw === "bronze") return "dong";
        if (raw === "thuong" || raw === "normal" || raw === "default") return "thuong";

        return "thuong";
    }

    function normalizeProfileType(profileType) {
        const raw = normalizeText(profileType);

        if (raw === "doanhnghiep" || raw === "business" || raw === "company") {
            return "doanhnghiep";
        }

        if (raw === "moi-gioi" || raw === "moigioi" || raw === "canhan" || raw === "personal") {
            return "canhan";
        }

        return "canhan";
    }

    function resolveContactProfileUrl(profileType, existingUrl) {
        if (existingUrl && String(existingUrl).trim()) {
            return String(existingUrl).trim();
        }

        return "";
    }

    function resolveDetailUrl(post) {
        if (post.detailUrl && String(post.detailUrl).trim()) return post.detailUrl;
        return "../pages/chi-tiet-tin.html?id=" + encodeURIComponent(post.id);
    }

    function getFirstImageFromPost(post) {
        if (!post) return "";

        if (post.thumbnail && typeof post.thumbnail === "string" && post.thumbnail.trim()) {
            return post.thumbnail;
        }

        if (Array.isArray(post.images) && post.images.length) {
            const firstImage = post.images[0];

            if (typeof firstImage === "string" && firstImage.trim()) {
                return firstImage;
            }

            if (firstImage && typeof firstImage === "object") {
                if (firstImage.dataUrl && String(firstImage.dataUrl).trim()) {
                    return firstImage.dataUrl;
                }

                if (firstImage.url && String(firstImage.url).trim()) {
                    return firstImage.url;
                }
            }
        }

        return "";
    }

    function normalizeImages(images) {
        if (!Array.isArray(images)) return [];

        return images.filter(function (img) {
            if (!img) return false;

            if (typeof img === "string") {
                return !!img.trim();
            }

            if (typeof img === "object") {
                return !!(
                    (img.dataUrl && String(img.dataUrl).trim()) ||
                    (img.url && String(img.url).trim())
                );
            }

            return false;
        });
    }

    function sanitizePost(post) {
        if (!post || typeof post !== "object") return null;

        const now = new Date().toISOString();
        const normalizedFlow = normalizeFlow(post.flow);
        const normalizedPostType = normalizePostType(post.postType, normalizedFlow);
        const normalizedStatus = normalizeStatus(post.status);
        const safeImages = normalizeImages(post.images);

        const safePost = {
            ...post,
            id: post.id || "post_" + Date.now(),
            flow: normalizedFlow,
            postType: normalizedPostType,
            profileType: normalizeProfileType(post.profileType || post.accountType || post.userType),
            vipLevel: normalizedFlow === "real_estate" ? normalizeVipLevel(post.vipLevel) : "thuong",
            status: normalizedStatus,
            slug: post.slug || slugify((post.title || "tin-dang") + "-" + (post.id || Date.now())),
            createdAt: post.createdAt || now,
            updatedAt: post.updatedAt || now,
            images: safeImages,
            imageCount: safeImages.length
        };

        safePost.thumbnail = post.thumbnail || getFirstImageFromPost({
            thumbnail: post.thumbnail,
            images: safeImages
        });

        safePost.contactProfileUrl = resolveContactProfileUrl(safePost.profileType, post.contactProfileUrl);
        safePost.detailUrl = resolveDetailUrl(safePost);

        if (normalizedFlow !== "real_estate") {
            safePost.projectEnabled = false;
            safePost.projectId = "";
            safePost.projectName = "";
            safePost.projectSlug = "";
            safePost.projectTypeName = "";
            safePost.projectDeveloper = "";
            safePost.pricePerSquareMeter = null;
        }

        return safePost;
    }

    function syncDerivedStores(posts) {
        ensureUserStorage();

        const safePosts = Array.isArray(posts) ? posts.map(sanitizePost).filter(Boolean) : getAllPosts();

        if (typeof window.userStorage.syncDerivedPostStores === "function") {
            window.userStorage.syncDerivedPostStores(safePosts);
        } else {
            const propertyPosts = safePosts.filter(function (post) {
                return post && post.flow === "real_estate";
            });
            const salePosts = propertyPosts.filter(function (post) {
                return post && post.postType === "ban";
            });
            const rentalPosts = propertyPosts.filter(function (post) {
                return post && post.postType === "thue";
            });
            const constructionPosts = safePosts.filter(function (post) {
                return post && post.flow === "construction";
            });

            localStorage.setItem("propertyPosts", JSON.stringify(propertyPosts));
            localStorage.setItem("salePosts", JSON.stringify(salePosts));
            localStorage.setItem("rentalPosts", JSON.stringify(rentalPosts));
            localStorage.setItem("constructionPosts", JSON.stringify(constructionPosts));
        }

        if (ensureProjectService() && typeof window.projectService.syncProjectCounts === "function") {
            try {
                window.projectService.syncProjectCounts(safePosts);
            } catch (error) {
                console.warn("projectService.syncProjectCounts lỗi:", error);
            }
        }

        return safePosts;
    }

    function getAllPosts() {
        ensureUserStorage();
        const posts = window.userStorage.getAllPosts() || [];
        return Array.isArray(posts) ? posts.map(sanitizePost).filter(Boolean) : [];
    }

    function saveAllPosts(posts) {
        ensureUserStorage();
        const safePosts = Array.isArray(posts) ? posts.map(sanitizePost).filter(Boolean) : [];
        window.userStorage.saveAllPosts(safePosts);
        syncDerivedStores(safePosts);
        return safePosts;
    }

    function filterPostsByStatus(posts, status) {
        if (!status) return posts;
        const normalized = normalizeStatus(status);
        return posts.filter(function (post) {
            return post && normalizeStatus(post.status) === normalized;
        });
    }

    function getPostsByFlow(flow, status) {
        const normalizedFlow = normalizeFlow(flow);
        const posts = getAllPosts().filter(function (post) {
            return post && post.flow === normalizedFlow;
        });
        return filterPostsByStatus(posts, status);
    }

    function getSalePosts(status) {
        const posts = getAllPosts().filter(function (post) {
            return post && post.flow === "real_estate" && post.postType === "ban";
        });
        return filterPostsByStatus(posts, status);
    }

    function getRentalPosts(status) {
        const posts = getAllPosts().filter(function (post) {
            return post && post.flow === "real_estate" && post.postType === "thue";
        });
        return filterPostsByStatus(posts, status);
    }

    function getConstructionPosts(status) {
        const posts = getAllPosts().filter(function (post) {
            return post && post.flow === "construction";
        });
        return filterPostsByStatus(posts, status);
    }

    function getApprovedSalePosts() {
        return getSalePosts("approved");
    }

    function getApprovedRentalPosts() {
        return getRentalPosts("approved");
    }

    function getPendingPosts() {
        return getAllPosts().filter(function (post) {
            return normalizeStatus(post.status) === "pending";
        });
    }

    function getPostsByProjectSlug(projectSlug, status) {
        if (!projectSlug) return [];
        const posts = getAllPosts().filter(function (post) {
            return post && post.projectSlug === projectSlug;
        });
        return filterPostsByStatus(posts, status);
    }

    function getPostsByUser(user) {
        ensureUserStorage();
        const posts = window.userStorage.getMyPosts(user) || [];
        return Array.isArray(posts) ? posts.map(sanitizePost).filter(Boolean) : [];
    }

    function getPostById(postId) {
        ensureUserStorage();
        const post = window.userStorage.getPostById(postId);
        return sanitizePost(post);
    }

    function getPostBySlug(slug) {
        if (!slug) return null;
        return getAllPosts().find(function (post) {
            return post && post.slug === slug;
        }) || null;
    }

    function createPost(postData) {
        ensureUserStorage();

        if (!postData || typeof postData !== "object") {
            throw new Error("createPost: postData không hợp lệ");
        }

        const now = new Date().toISOString();
        const draftId = postData.id || "post_" + Date.now();

        const nextPost = sanitizePost({
            ...postData,
            id: draftId,
            status: postData.status || "pending",
            createdAt: postData.createdAt || now,
            updatedAt: now
        });

        try {
            window.userStorage.addPost(nextPost);
        } catch (error) {
            if (
                error &&
                (
                    error.name === "QuotaExceededError" ||
                    String(error.message || "").toLowerCase().includes("quota")
                )
            ) {
                throw new Error("Bộ nhớ localStorage đã đầy. Hãy giảm số lượng ảnh hoặc xóa bớt dữ liệu demo cũ.");
            }
            throw error;
        }

        syncDerivedStores();
        return nextPost;
    }

    function updatePost(postId, updatedData) {
        ensureUserStorage();

        if (!postId) {
            throw new Error("updatePost: thiếu postId");
        }

        const currentPost = getPostById(postId);
        if (!currentPost) {
            throw new Error("updatePost: không tìm thấy bài đăng");
        }

        const mergedPost = sanitizePost({
            ...currentPost,
            ...(updatedData || {}),
            id: postId,
            updatedAt: new Date().toISOString()
        });

        const result = window.userStorage.updatePost(postId, mergedPost);
        syncDerivedStores();

        return sanitizePost(result);
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

        const copy = sanitizePost({
            ...original,
            id: "post_" + timestamp,
            slug: (original.slug || "tin-dang") + "-copy-" + timestamp,
            title: (original.title || "Tin đăng") + " - Bản sao",
            status: "pending",
            approvedAt: "",
            rejectedAt: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return createPost(copy);
    }

    function togglePostStatus(postId, nextStatus) {
        if (!nextStatus) {
            throw new Error("togglePostStatus: thiếu nextStatus");
        }

        const normalizedStatus = normalizeStatus(nextStatus);
        const patch = {
            status: normalizedStatus
        };

        if (normalizedStatus === "approved") {
            patch.approvedAt = new Date().toISOString();
            patch.rejectedAt = "";
        }

        if (normalizedStatus === "rejected") {
            patch.rejectedAt = new Date().toISOString();
        }

        return updatePost(postId, patch);
    }

    function getPostStats(postsInput) {
        const posts = Array.isArray(postsInput)
            ? postsInput.map(sanitizePost).filter(Boolean)
            : getAllPosts();

        return {
            total: posts.length,
            pending: posts.filter(function (p) { return normalizeStatus(p.status) === "pending"; }).length,
            approved: posts.filter(function (p) { return normalizeStatus(p.status) === "approved"; }).length,
            rejected: posts.filter(function (p) { return normalizeStatus(p.status) === "rejected"; }).length,
            hidden: posts.filter(function (p) { return normalizeStatus(p.status) === "hidden"; }).length,
            demo: posts.filter(function (p) { return normalizeStatus(p.status) === "demo"; }).length,
            sale: posts.filter(function (p) { return p.flow === "real_estate" && p.postType === "ban"; }).length,
            rental: posts.filter(function (p) { return p.flow === "real_estate" && p.postType === "thue"; }).length,
            construction: posts.filter(function (p) { return p.flow === "construction"; }).length,
            withProject: posts.filter(function (p) { return p.projectSlug || p.projectName; }).length,
            vipKimCuong: posts.filter(function (p) { return p.vipLevel === "kim-cuong"; }).length,
            vipVang: posts.filter(function (p) { return p.vipLevel === "vang"; }).length,
            vipBac: posts.filter(function (p) { return p.vipLevel === "bac"; }).length,
            vipDong: posts.filter(function (p) { return p.vipLevel === "dong"; }).length
        };
    }

    function getAverageSalePriceByProject(projectSlug, approvedOnly) {
        const salePosts = getPostsByProjectSlug(
            projectSlug,
            approvedOnly ? "approved" : ""
        ).filter(function (post) {
            return post &&
                post.flow === "real_estate" &&
                post.postType === "ban" &&
                typeof post.pricePerSquareMeter === "number" &&
                post.pricePerSquareMeter > 0;
        });

        if (!salePosts.length) return null;

        const total = salePosts.reduce(function (sum, post) {
            return sum + post.pricePerSquareMeter;
        }, 0);

        return Math.round(total / salePosts.length);
    }

    window.postStorage = {
        getAllPosts: getAllPosts,
        saveAllPosts: saveAllPosts,
        syncDerivedStores: syncDerivedStores,
        getPostsByFlow: getPostsByFlow,
        getSalePosts: getSalePosts,
        getRentalPosts: getRentalPosts,
        getConstructionPosts: getConstructionPosts,
        getApprovedSalePosts: getApprovedSalePosts,
        getApprovedRentalPosts: getApprovedRentalPosts,
        getPendingPosts: getPendingPosts,
        getPostsByProjectSlug: getPostsByProjectSlug,
        getPostsByUser: getPostsByUser,
        getPostById: getPostById,
        getPostBySlug: getPostBySlug,
        createPost: createPost,
        updatePost: updatePost,
        deletePost: deletePost,
        duplicatePost: duplicatePost,
        togglePostStatus: togglePostStatus,
        getPostStats: getPostStats,
        getAverageSalePriceByProject: getAverageSalePriceByProject
    };
})();
