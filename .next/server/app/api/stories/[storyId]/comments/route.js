/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/stories/[storyId]/comments/route";
exports.ids = ["app/api/stories/[storyId]/comments/route"];
exports.modules = {

/***/ "(rsc)/./app/api/stories/[storyId]/comments/route.ts":
/*!*****************************************************!*\
  !*** ./app/api/stories/[storyId]/comments/route.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/supabase/server */ \"(rsc)/./lib/supabase/server.ts\");\n\n\nasync function GET(_request, { params }) {\n    const { storyId } = await params;\n    const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__.createClient)();\n    try {\n        // Get current user (optional) to determine upvote status\n        const { data: { user: authUser } } = await supabase.auth.getUser();\n        let currentUserId = null;\n        if (authUser?.email) {\n            const { data: me } = await supabase.from('User').select('user_id').eq('email', authUser.email).maybeSingle();\n            currentUserId = me?.user_id || null;\n        }\n        // Fetch comments with author and upvote info\n        const { data: comments, error } = await supabase.from('Comment').select(`comment_id:comment_id, content, created_at, author_id, author:User!Comment_author_id_fkey(username, display_name), CommentUpvote(user_id)`).eq('story_id', storyId).order('created_at', {\n            ascending: false\n        });\n        if (error) throw error;\n        // Map to client shape\n        const mapped = (comments || []).map((c)=>{\n            const commentWithUpvotes = c;\n            const upvoteArray = commentWithUpvotes.CommentUpvote;\n            const upvotes = upvoteArray ? upvoteArray.length : 0;\n            const hasUpvoted = !!upvoteArray?.some((u)=>u.user_id === currentUserId);\n            // We cannot check by email easily; will mark false for now\n            return {\n                comment_id: c.comment_id,\n                content: c.content,\n                created_at: c.created_at,\n                upvotes,\n                hasUpvoted,\n                author: c.author\n            };\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            comments: mapped\n        });\n    } catch (err) {\n        console.error('Error fetching comments:', err);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to fetch comments'\n        }, {\n            status: 500\n        });\n    }\n}\nasync function POST(request, { params }) {\n    const { storyId } = await params;\n    const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__.createClient)();\n    try {\n        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();\n        if (authError || !authUser) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Unauthorized'\n            }, {\n                status: 401\n            });\n        }\n        const { content } = await request.json();\n        if (!content || typeof content !== 'string' || content.trim().length === 0) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Content is required'\n            }, {\n                status: 400\n            });\n        }\n        if (content.length > 70) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Comment too long (70 chars max)'\n            }, {\n                status: 400\n            });\n        }\n        // Find DB user by email\n        const { data: dbUser, error: userError } = await supabase.from('User').select('user_id, username, display_name').eq('email', authUser.email).single();\n        if (userError || !dbUser) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User not found'\n            }, {\n                status: 404\n            });\n        }\n        // Insert comment\n        const { data: inserted, error: insertErr } = await supabase.from('Comment').insert({\n            story_id: storyId,\n            author_id: dbUser.user_id,\n            content: content.trim()\n        }).select('comment_id, content, created_at').single();\n        if (insertErr) throw insertErr;\n        const comment = {\n            comment_id: inserted.comment_id,\n            content: inserted.content,\n            created_at: inserted.created_at,\n            upvotes: 0,\n            hasUpvoted: false,\n            author: {\n                username: dbUser.username,\n                display_name: dbUser.display_name\n            }\n        };\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            comment\n        }, {\n            status: 201\n        });\n    } catch (err) {\n        console.error('Error posting comment:', err);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Failed to post comment'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3N0b3JpZXMvW3N0b3J5SWRdL2NvbW1lbnRzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBd0Q7QUFDSDtBQUU5QyxlQUFlRSxJQUNwQkMsUUFBcUIsRUFDckIsRUFBRUMsTUFBTSxFQUE0QztJQUVwRCxNQUFNLEVBQUVDLE9BQU8sRUFBRSxHQUFHLE1BQU1EO0lBQzFCLE1BQU1FLFdBQVcsTUFBTUwsa0VBQVlBO0lBRW5DLElBQUk7UUFDRix5REFBeUQ7UUFDekQsTUFBTSxFQUNKTSxNQUFNLEVBQUVDLE1BQU1DLFFBQVEsRUFBRSxFQUN6QixHQUFHLE1BQU1ILFNBQVNJLElBQUksQ0FBQ0MsT0FBTztRQUUvQixJQUFJQyxnQkFBK0I7UUFFbkMsSUFBSUgsVUFBVUksT0FBTztZQUNuQixNQUFNLEVBQUVOLE1BQU1PLEVBQUUsRUFBRSxHQUFHLE1BQU1SLFNBQ3hCUyxJQUFJLENBQUMsUUFDTEMsTUFBTSxDQUFDLFdBQ1BDLEVBQUUsQ0FBQyxTQUFTUixTQUFTSSxLQUFLLEVBQzFCSyxXQUFXO1lBQ2ROLGdCQUFnQkUsSUFBSUssV0FBVztRQUNqQztRQUVBLDZDQUE2QztRQUM3QyxNQUFNLEVBQUVaLE1BQU1hLFFBQVEsRUFBRUMsS0FBSyxFQUFFLEdBQUcsTUFBTWYsU0FDckNTLElBQUksQ0FBQyxXQUNMQyxNQUFNLENBQ0wsQ0FBQyx5SUFBeUksQ0FBQyxFQUU1SUMsRUFBRSxDQUFDLFlBQVlaLFNBQ2ZpQixLQUFLLENBQUMsY0FBYztZQUFFQyxXQUFXO1FBQU07UUFFMUMsSUFBSUYsT0FBTyxNQUFNQTtRQUVqQixzQkFBc0I7UUFDdEIsTUFBTUcsU0FBUyxDQUFDSixZQUFZLEVBQUUsRUFBRUssR0FBRyxDQUFDLENBQUNDO1lBQ25DLE1BQU1DLHFCQUFxQkQ7WUFDM0IsTUFBTUUsY0FBY0QsbUJBQW1CRSxhQUFhO1lBQ3BELE1BQU1DLFVBQVVGLGNBQWNBLFlBQVlHLE1BQU0sR0FBRztZQUNuRCxNQUFNQyxhQUFhLENB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RWIsUUFBUTtRQUFJO0lBQ3RELEVBQUUsT0FBT0YsS0FBSztRQUNaQyxRQUFRcEIsS0FBSyxDQUFDLDBCQUEwQm1CO1FBQ3hDLE9BQU94QyxxREFBWUEsQ0FBQ3VDLElBQUksQ0FBQztZQUFFbEIsT0FBTztRQUF5QixHQUFHO1lBQUVxQixRQUFRO1FBQUk7SUFDOUU7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL2tldmlucm9zZS9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9Ecm9wYm94L3ZpYmUvZGlpbm8vYXBwL2FwaS9zdG9yaWVzL1tzdG9yeUlkXS9jb21tZW50cy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQC9saWIvc3VwYWJhc2Uvc2VydmVyJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChcbiAgX3JlcXVlc3Q6IE5leHRSZXF1ZXN0LFxuICB7IHBhcmFtcyB9OiB7IHBhcmFtczogUHJvbWlzZTx7IHN0b3J5SWQ6IHN0cmluZyB9PiB9XG4pIHtcbiAgY29uc3QgeyBzdG9yeUlkIH0gPSBhd2FpdCBwYXJhbXM7XG4gIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgY3JlYXRlQ2xpZW50KCk7XG5cbiAgdHJ5IHtcbiAgICAvLyBHZXQgY3VycmVudCB1c2VyIChvcHRpb25hbCkgdG8gZGV0ZXJtaW5lIHVwdm90ZSBzdGF0dXNcbiAgICBjb25zdCB7XG4gICAgICBkYXRhOiB7IHVzZXI6IGF1dGhVc2VyIH0sXG4gICAgfSA9IGF3YWl0IHN1cGFiYXNlLmF1dGguZ2V0VXNlcigpO1xuXG4gICAgbGV0IGN1cnJlbnRVc2VySWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGF1dGhVc2VyPy5lbWFpbCkge1xuICAgICAgY29uc3QgeyBkYXRhOiBtZSB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgICAgLmZyb20oJ1VzZXInKVxuICAgICAgICAuc2VsZWN0KCd1c2VyX2lkJylcbiAgICAgICAgLmVxKCdlbWFpbCcsIGF1dGhVc2VyLmVtYWlsKVxuICAgICAgICAubWF5YmVTaW5nbGUoKTtcbiAgICAgIGN1cnJlbnRVc2VySWQgPSBtZT8udXNlcl9pZCB8fCBudWxsO1xuICAgIH1cblxuICAgIC8vIEZldGNoIGNvbW1lbnRzIHdpdGggYXV0aG9yIGFuZCB1cHZvdGUgaW5mb1xuICAgIGNvbnN0IHsgZGF0YTogY29tbWVudHMsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ0NvbW1lbnQnKVxuICAgICAgLnNlbGVjdChcbiAgICAgICAgYGNvbW1lbnRfaWQ6Y29tbWVudF9pZCwgY29udGVudCwgY3JlYXRlZF9hdCwgYXV0aG9yX2lkLCBhdXRob3I6VXNlciFDb21tZW50X2F1dGhvcl9pZF9ma2V5KHVzZXJuYW1lLCBkaXNwbGF5X25hbWUpLCBDb21tZW50VXB2b3RlKHVzZXJfaWQpYFxuICAgICAgKVxuICAgICAgLmVxKCdzdG9yeV9pZCcsIHN0b3J5SWQpXG4gICAgICAub3JkZXIoJ2NyZWF0ZWRfYXQnLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XG5cbiAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuXG4gICAgLy8gTWFwIHRvIGNsaWVudCBzaGFwZVxuICAgIGNvbnN0IG1hcHBlZCA9IChjb21tZW50cyB8fCBbXSkubWFwKChjKSA9PiB7XG4gICAgICBjb25zdCBjb21tZW50V2l0aFVwdm90ZXMgPSBjIGFzIHR5cGVvZiBjICYgeyBDb21tZW50VXB2b3RlOiB7IHVzZXJfaWQ6IHN0cmluZyB9W10gfCBudWxsIH07XG4gICAgICBjb25zdCB1cHZvdGVBcnJheSA9IGNvbW1lbnRXaXRoVXB2b3Rlcy5Db21tZW50VXB2b3RlO1xuICAgICAgY29uc3QgdXB2b3RlcyA9IHVwdm90ZUFycmF5ID8gdXB2b3RlQXJyYXkubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IGhhc1Vwdm90ZWQgPSAhIXVwdm90ZUFycmF5Py5zb21lKCh1KSA9PiB1LnVzZXJfaWQgPT09IGN1cnJlbnRVc2VySWQpO1xuICAgICAgLy8gV2UgY2Fubm90IGNoZWNrIGJ5IGVtYWlsIGVhc2lseTsgd2lsbCBtYXJrIGZhbHNlIGZvciBub3dcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbW1lbnRfaWQ6IGMuY29tbWVudF9pZCxcbiAgICAgICAgY29udGVudDogYy5jb250ZW50LFxuICAgICAgICBjcmVhdGVkX2F0OiBjLmNyZWF0ZWRfYXQsXG4gICAgICAgIHVwdm90ZXMsXG4gICAgICAgIGhhc1Vwdm90ZWQsXG4gICAgICAgIGF1dGhvcjogYy5hdXRob3IsXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgY29tbWVudHM6IG1hcHBlZCB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgY29tbWVudHM6JywgZXJyKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCBjb21tZW50cycgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChcbiAgcmVxdWVzdDogTmV4dFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiBQcm9taXNlPHsgc3RvcnlJZDogc3RyaW5nIH0+IH1cbikge1xuICBjb25zdCB7IHN0b3J5SWQgfSA9IGF3YWl0IHBhcmFtcztcbiAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCBjcmVhdGVDbGllbnQoKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHtcbiAgICAgIGRhdGE6IHsgdXNlcjogYXV0aFVzZXIgfSxcbiAgICAgIGVycm9yOiBhdXRoRXJyb3IsXG4gICAgfSA9IGF3YWl0IHN1cGFiYXNlLmF1dGguZ2V0VXNlcigpO1xuXG4gICAgaWYgKGF1dGhFcnJvciB8fCAhYXV0aFVzZXIpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVW5hdXRob3JpemVkJyB9LCB7IHN0YXR1czogNDAxIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHsgY29udGVudCB9ID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XG5cbiAgICBpZiAoIWNvbnRlbnQgfHwgdHlwZW9mIGNvbnRlbnQgIT09ICdzdHJpbmcnIHx8IGNvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdDb250ZW50IGlzIHJlcXVpcmVkJyB9LCB7IHN0YXR1czogNDAwIH0pO1xuICAgIH1cblxuICAgIGlmIChjb250ZW50Lmxlbmd0aCA+IDcwKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0NvbW1lbnQgdG9vIGxvbmcgKDcwIGNoYXJzIG1heCknIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gICAgfVxuXG4gICAgLy8gRmluZCBEQiB1c2VyIGJ5IGVtYWlsXG4gICAgY29uc3QgeyBkYXRhOiBkYlVzZXIsIGVycm9yOiB1c2VyRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgnVXNlcicpXG4gICAgICAuc2VsZWN0KCd1c2VyX2lkLCB1c2VybmFtZSwgZGlzcGxheV9uYW1lJylcbiAgICAgIC5lcSgnZW1haWwnLCBhdXRoVXNlci5lbWFpbClcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmICh1c2VyRXJyb3IgfHwgIWRiVXNlcikge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgY29tbWVudFxuICAgIGNvbnN0IHsgZGF0YTogaW5zZXJ0ZWQsIGVycm9yOiBpbnNlcnRFcnIgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgnQ29tbWVudCcpXG4gICAgICAuaW5zZXJ0KHsgc3RvcnlfaWQ6IHN0b3J5SWQsIGF1dGhvcl9pZDogZGJVc2VyLnVzZXJfaWQsIGNvbnRlbnQ6IGNvbnRlbnQudHJpbSgpIH0pXG4gICAgICAuc2VsZWN0KCdjb21tZW50X2lkLCBjb250ZW50LCBjcmVhdGVkX2F0JylcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmIChpbnNlcnRFcnIpIHRocm93IGluc2VydEVycjtcblxuICAgIGNvbnN0IGNvbW1lbnQgPSB7XG4gICAgICBjb21tZW50X2lkOiBpbnNlcnRlZC5jb21tZW50X2lkLFxuICAgICAgY29udGVudDogaW5zZXJ0ZWQuY29udGVudCxcbiAgICAgIGNyZWF0ZWRfYXQ6IGluc2VydGVkLmNyZWF0ZWRfYXQsXG4gICAgICB1cHZvdGVzOiAwLFxuICAgICAgaGFzVXB2b3RlZDogZmFsc2UsXG4gICAgICBhdXRob3I6IHtcbiAgICAgICAgdXNlcm5hbWU6IGRiVXNlci51c2VybmFtZSxcbiAgICAgICAgZGlzcGxheV9uYW1lOiBkYlVzZXIuZGlzcGxheV9uYW1lLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgY29tbWVudCB9LCB7IHN0YXR1czogMjAxIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwb3N0aW5nIGNvbW1lbnQ6JywgZXJyKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBwb3N0IGNvbW1lbnQnIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn0gIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNyZWF0ZUNsaWVudCIsIkdFVCIsIl9yZXF1ZXN0IiwicGFyYW1zIiwic3RvcnlJZCIsInN1cGFiYXNlIiwiZGF0YSIsInVzZXIiLCJhdXRoVXNlciIsImF1dGgiLCJnZXRVc2VyIiwiY3VycmVudFVzZXJJZCIsImVtYWlsIiwibWUiLCJmcm9tIiwic2VsZWN0IiwiZXEiLCJtYXliZVNpbmdsZSIsInVzZXJfaWQiLCJjb21tZW50cyIsImVycm9yIiwib3JkZXIiLCJhc2NlbmRpbmciLCJtYXBwZWQiLCJtYXAiLCJjIiwiY29tbWVudFdpdGhVcHZvdGVzIiwidXB2b3RlQXJyYXkiLCJDb21tZW50VXB2b3RlIiwidXB2b3RlcyIsImxlbmd0aCIsImhhc1Vwdm90ZWQiLCJzb21lIiwidSIsImNvbW1lbnRfaWQiLCJjb250ZW50IiwiY3JlYXRlZF9hdCIsImF1dGhvciIsImpzb24iLCJlcnIiLCJjb25zb2xlIiwic3RhdHVzIiwiUE9TVCIsInJlcXVlc3QiLCJhdXRoRXJyb3IiLCJ0cmltIiwiZGJVc2VyIiwidXNlckVycm9yIiwic2luZ2xlIiwiaW5zZXJ0ZWQiLCJpbnNlcnRFcnIiLCJpbnNlcnQiLCJzdG9yeV9pZCIsImF1dGhvcl9pZCIsImNvbW1lbnQiLCJ1c2VybmFtZSIsImRpc3BsYXlfbmFtZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/stories/[storyId]/comments/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabase/server.ts":
/*!********************************!*\
  !*** ./lib/supabase/server.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createClient: () => (/* binding */ createClient)\n/* harmony export */ });\n/* harmony import */ var _barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! __barrel_optimize__?names=createServerClient!=!@supabase/ssr */ \"(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n\n\nasync function createClient() {\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    return (0,_barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__.createServerClient)(\"https://zinencmbqximkrqfkjol.supabase.co\", \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbmVuY21icXhpbWtycWZram9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjYyMjIsImV4cCI6MjA2NzQwMjIyMn0.RBrnl_ksL9DHISglmeFKOicMlS9czl8xdgAKF7wHyxQ\", {\n        cookies: {\n            getAll () {\n                return cookieStore.getAll();\n            },\n            setAll (cookiesToSet) {\n                try {\n                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));\n                } catch  {\n                // The `setAll` method was called from a Server Component.\n                // This can be ignored if you have middleware refreshing\n                // user sessions.\n                }\n            }\n        },\n        auth: {\n            debug: \"development\" === 'development'\n        },\n        db: {\n            schema: 'public'\n        },\n        global: {\n            headers: {\n                'x-client-info': 'diino-server'\n            }\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2Uvc2VydmVyLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFrRDtBQUNaO0FBRS9CLGVBQWVFO0lBQ3BCLE1BQU1DLGNBQWMsTUFBTUYscURBQU9BO0lBRWpDLE9BQU9ELDBHQUFrQkEsQ0FDdkJJLDBDQUFvQyxFQUNwQ0Esa05BQXlDLEVBQ3pDO1FBQ0VILFNBQVM7WUFDUE87Z0JBQ0UsT0FBT0wsWUFBWUssTUFBTTtZQUMzQjtZQUNBQyxRQUFPQyxZQUFZO2dCQUNqQixJQUFJO29CQUNGQSxhQUFhQyxPQUFPLENBQUMsQ0FBQyxFQUFFQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxFQUFFLEdBQzVDWCxZQUFZWSxHQUFHLENBQUNILE1BQU1DLE9BQU9DO2dCQUVqQyxFQUFFLE9BQU07Z0JBQ04sMERBQTBEO2dCQUMxRCx3REFBd0Q7Z0JBQ3hELGlCQUFpQjtnQkFDbkI7WUFDRjtRQUNGO1FBQ0FFLE1BQU07WUFDSkMsT0FBT2Isa0JBQXlCO1FBQ2xDO1FBQ0FjLElBQUk7WUFDRkMsUUFBUTtRQUNWO1FBQ0FDLFFBQVE7WUFDTkMsU0FBUztnQkFDUCxpQkFBaUI7WUFDbkI7UUFDRjtJQUNGO0FBRUoiLCJzb3VyY2VzIjpbIi9Vc2Vycy9rZXZpbnJvc2UvTGlicmFyeS9DbG91ZFN0b3JhZ2UvRHJvcGJveC92aWJlL2RpaW5vL2xpYi9zdXBhYmFzZS9zZXJ2ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU2VydmVyQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3NzcidcbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tICduZXh0L2hlYWRlcnMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVDbGllbnQoKSB7XG4gIGNvbnN0IGNvb2tpZVN0b3JlID0gYXdhaXQgY29va2llcygpXG5cbiAgcmV0dXJuIGNyZWF0ZVNlcnZlckNsaWVudChcbiAgICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhLFxuICAgIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZISxcbiAgICB7XG4gICAgICBjb29raWVzOiB7XG4gICAgICAgIGdldEFsbCgpIHtcbiAgICAgICAgICByZXR1cm4gY29va2llU3RvcmUuZ2V0QWxsKClcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QWxsKGNvb2tpZXNUb1NldCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb29raWVzVG9TZXQuZm9yRWFjaCgoeyBuYW1lLCB2YWx1ZSwgb3B0aW9ucyB9KSA9PlxuICAgICAgICAgICAgICBjb29raWVTdG9yZS5zZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBUaGUgYHNldEFsbGAgbWV0aG9kIHdhcyBjYWxsZWQgZnJvbSBhIFNlcnZlciBDb21wb25lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiBiZSBpZ25vcmVkIGlmIHlvdSBoYXZlIG1pZGRsZXdhcmUgcmVmcmVzaGluZ1xuICAgICAgICAgICAgLy8gdXNlciBzZXNzaW9ucy5cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYXV0aDoge1xuICAgICAgICBkZWJ1ZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCdcbiAgICAgIH0sXG4gICAgICBkYjoge1xuICAgICAgICBzY2hlbWE6ICdwdWJsaWMnXG4gICAgICB9LFxuICAgICAgZ2xvYmFsOiB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAneC1jbGllbnQtaW5mbyc6ICdkaWluby1zZXJ2ZXInXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIClcbn0iXSwibmFtZXMiOlsiY3JlYXRlU2VydmVyQ2xpZW50IiwiY29va2llcyIsImNyZWF0ZUNsaWVudCIsImNvb2tpZVN0b3JlIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwiZ2V0QWxsIiwic2V0QWxsIiwiY29va2llc1RvU2V0IiwiZm9yRWFjaCIsIm5hbWUiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJzZXQiLCJhdXRoIiwiZGVidWciLCJkYiIsInNjaGVtYSIsImdsb2JhbCIsImhlYWRlcnMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabase/server.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&page=%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&page=%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_stories_storyId_comments_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/stories/[storyId]/comments/route.ts */ \"(rsc)/./app/api/stories/[storyId]/comments/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/stories/[storyId]/comments/route\",\n        pathname: \"/api/stories/[storyId]/comments\",\n        filename: \"route\",\n        bundlePath: \"app/api/stories/[storyId]/comments/route\"\n    },\n    resolvedPagePath: \"/Users/kevinrose/Library/CloudStorage/Dropbox/vibe/diino/app/api/stories/[storyId]/comments/route.ts\",\n    nextConfigOutput,\n    userland: _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_stories_storyId_comments_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzdG9yaWVzJTJGJTVCc3RvcnlJZCU1RCUyRmNvbW1lbnRzJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzdG9yaWVzJTJGJTVCc3RvcnlJZCU1RCUyRmNvbW1lbnRzJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc3RvcmllcyUyRiU1QnN0b3J5SWQlNUQlMkZjb21tZW50cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNvRDtBQUNqSTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL2tldmlucm9zZS9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9Ecm9wYm94L3ZpYmUvZGlpbm8vYXBwL2FwaS9zdG9yaWVzL1tzdG9yeUlkXS9jb21tZW50cy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3Rvcmllcy9bc3RvcnlJZF0vY29tbWVudHMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9zdG9yaWVzL1tzdG9yeUlkXS9jb21tZW50c1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc3Rvcmllcy9bc3RvcnlJZF0vY29tbWVudHMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMva2V2aW5yb3NlL0xpYnJhcnkvQ2xvdWRTdG9yYWdlL0Ryb3Bib3gvdmliZS9kaWluby9hcHAvYXBpL3N0b3JpZXMvW3N0b3J5SWRdL2NvbW1lbnRzL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&page=%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js":
/*!********************************************************************************************************!*\
  !*** __barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createServerClient: () => (/* reexport safe */ _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_node_modules_supabase_ssr_dist_module_createServerClient_js__WEBPACK_IMPORTED_MODULE_0__.createServerClient)\n/* harmony export */ });\n/* harmony import */ var _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_node_modules_supabase_ssr_dist_module_createServerClient_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@supabase/ssr/dist/module/createServerClient.js */ \"(rsc)/./node_modules/@supabase/ssr/dist/module/createServerClient.js\");\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvX19iYXJyZWxfb3B0aW1pemVfXz9uYW1lcz1jcmVhdGVTZXJ2ZXJDbGllbnQhPSEuL25vZGVfbW9kdWxlcy9Ac3VwYWJhc2Uvc3NyL2Rpc3QvbW9kdWxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQ3FDIiwic291cmNlcyI6WyIvVXNlcnMva2V2aW5yb3NlL0xpYnJhcnkvQ2xvdWRTdG9yYWdlL0Ryb3Bib3gvc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?32c4":
/*!****************************!*\
  !*** bufferutil (ignored) ***!
  \****************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/ws","vendor-chunks/whatwg-url","vendor-chunks/cookie","vendor-chunks/webidl-conversions","vendor-chunks/isows"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&page=%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstories%2F%5BstoryId%5D%2Fcomments%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();