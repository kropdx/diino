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
exports.id = "app/api/tags/route";
exports.ids = ["app/api/tags/route"];
exports.modules = {

/***/ "(rsc)/./app/api/tags/route.ts":
/*!*******************************!*\
  !*** ./app/api/tags/route.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/supabase/server */ \"(rsc)/./lib/supabase/server.ts\");\n\n\n// GET /api/tags - Get all tags for the current user\nasync function GET(_request) {\n    try {\n        const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__.createClient)();\n        // Check authentication\n        const { data: { user }, error: authError } = await supabase.auth.getUser();\n        if (authError || !user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Unauthorized'\n            }, {\n                status: 401\n            });\n        }\n        console.log('Fetching profile for auth user:', user.id);\n        // Get the user's profile\n        const { data: profile, error: profileError } = await supabase.from('User').select('user_id').eq('user_id', user.id).single();\n        if (profileError) {\n            console.error('Profile fetch error:', profileError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User profile not found',\n                details: profileError.message,\n                hint: profileError.hint\n            }, {\n                status: 404\n            });\n        }\n        if (!profile) {\n            console.error('No profile found for user:', user.id);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User profile not found'\n            }, {\n                status: 404\n            });\n        }\n        console.log('Found profile:', profile);\n        // Get user's tags with canonical tag info and story count\n        const { data: userTags, error: tagsError } = await supabase.from('UserTag').select(`\n        *,\n        tag:CanonicalTag(*)\n      `).eq('user_id', profile.user_id).order('created_at', {\n            ascending: false\n        });\n        if (tagsError) {\n            console.error('Error fetching tags:', tagsError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Failed to fetch tags',\n                details: tagsError.message,\n                hint: tagsError.hint\n            }, {\n                status: 500\n            });\n        }\n        // Get story counts for each tag\n        const tagsWithCounts = await Promise.all((userTags || []).map(async (userTag)=>{\n            const { count } = await supabase.from('Story').select('*', {\n                count: 'exact',\n                head: true\n            }).eq('user_tag_id', userTag.user_tag_id);\n            return {\n                ...userTag,\n                story_count: count || 0\n            };\n        }));\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(tagsWithCounts);\n    } catch (error) {\n        console.error('Error in GET /api/tags:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n// POST /api/tags - Create a new tag for the current user\nasync function POST(request) {\n    try {\n        const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_1__.createClient)();\n        // Check authentication\n        const { data: { user }, error: authError } = await supabase.auth.getUser();\n        if (authError || !user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Unauthorized'\n            }, {\n                status: 401\n            });\n        }\n        // Parse request body\n        const body = await request.json();\n        const { tagName } = body;\n        if (!tagName || typeof tagName !== 'string') {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Tag name is required'\n            }, {\n                status: 400\n            });\n        }\n        // Normalize tag name (lowercase, trim)\n        const normalizedTagName = tagName.trim().toLowerCase();\n        if (normalizedTagName.length === 0) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Tag name cannot be empty'\n            }, {\n                status: 400\n            });\n        }\n        // Get the user's profile\n        const { data: profile, error: profileError } = await supabase.from('User').select('user_id').eq('user_id', user.id).single();\n        if (profileError || !profile) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'User profile not found'\n            }, {\n                status: 404\n            });\n        }\n        // Check if canonical tag exists\n        let { data: canonicalTag } = await supabase.from('CanonicalTag').select('*').eq('name', normalizedTagName).single();\n        // If canonical tag doesn't exist, create it\n        if (!canonicalTag) {\n            const { data: newCanonicalTag, error: createError } = await supabase.from('CanonicalTag').insert({\n                name: normalizedTagName\n            }).select().single();\n            if (createError) {\n                console.error('Error creating canonical tag:', createError);\n                return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                    error: 'Failed to create tag'\n                }, {\n                    status: 500\n                });\n            }\n            canonicalTag = newCanonicalTag;\n        }\n        // Check if user already has this tag\n        const { data: existingUserTag } = await supabase.from('UserTag').select('*').eq('user_id', profile.user_id).eq('tag_id', canonicalTag.tag_id).single();\n        if (existingUserTag) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'You already have this tag'\n            }, {\n                status: 409\n            });\n        }\n        // Create user tag\n        const { data: userTag, error: userTagError } = await supabase.from('UserTag').insert({\n            user_id: profile.user_id,\n            tag_id: canonicalTag.tag_id\n        }).select(`\n        *,\n        tag:CanonicalTag(*)\n      `).single();\n        if (userTagError) {\n            console.error('Error creating user tag:', userTagError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Failed to create user tag'\n            }, {\n                status: 500\n            });\n        }\n        // Return with story count (0 for new tags)\n        const result = {\n            ...userTag,\n            story_count: 0\n        };\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(result, {\n            status: 201\n        });\n    } catch (error) {\n        console.error('Error in POST /api/tags:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFNLENBQUMsQ0FBQzs7O01BR1QsQ0FBQyxFQUNBRSxNQUFNO1FBRVQsSUFBSWlDLGNBQWM7WUFDaEJ6QyxRQUFRTixLQUFLLENBQUMsNEJBQTRCK0M7WUFDMUMsT0FBT3RELHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7Z0JBQUVKLE9BQU87WUFBNEIsR0FBRztnQkFBRUssUUFBUTtZQUFJO1FBQ2pGO1FBRUEsMkNBQTJDO1FBQzNDLE1BQU0yQyxTQUFTO1lBQ2IsR0FBR3JCLE9BQU87WUFDVkksYUFBYTtRQUNmO1FBRUEsT0FBT3RDLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM0QyxRQUFRO1lBQUUzQyxRQUFRO1FBQUk7SUFDakQsRUFBRSxPQUFPTCxPQUFPO1FBQ2RNLFFBQVFOLEtBQUssQ0FBQyw0QkFBNEJBO1FBQzFDLE9BQU9QLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7WUFBRUosT0FBTztRQUF3QixHQUFHO1lBQUVLLFFBQVE7UUFBSTtJQUM3RTtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMva2V2aW5yb3NlL0xpYnJhcnkvQ2xvdWRTdG9yYWdlL0Ryb3Bib3gvdmliZS9kaWluby9hcHAvYXBpL3RhZ3Mvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0AvbGliL3N1cGFiYXNlL3NlcnZlcic7XG5cbi8vIEdFVCAvYXBpL3RhZ3MgLSBHZXQgYWxsIHRhZ3MgZm9yIHRoZSBjdXJyZW50IHVzZXJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoX3JlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3VwYWJhc2UgPSBhd2FpdCBjcmVhdGVDbGllbnQoKTtcbiAgICBcbiAgICAvLyBDaGVjayBhdXRoZW50aWNhdGlvblxuICAgIGNvbnN0IHsgZGF0YTogeyB1c2VyIH0sIGVycm9yOiBhdXRoRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmF1dGguZ2V0VXNlcigpO1xuICAgIGlmIChhdXRoRXJyb3IgfHwgIXVzZXIpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVW5hdXRob3JpemVkJyB9LCB7IHN0YXR1czogNDAxIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBwcm9maWxlIGZvciBhdXRoIHVzZXI6JywgdXNlci5pZCk7XG4gICAgXG4gICAgLy8gR2V0IHRoZSB1c2VyJ3MgcHJvZmlsZVxuICAgIGNvbnN0IHsgZGF0YTogcHJvZmlsZSwgZXJyb3I6IHByb2ZpbGVFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCdVc2VyJylcbiAgICAgIC5zZWxlY3QoJ3VzZXJfaWQnKVxuICAgICAgLmVxKCd1c2VyX2lkJywgdXNlci5pZClcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmIChwcm9maWxlRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Byb2ZpbGUgZmV0Y2ggZXJyb3I6JywgcHJvZmlsZUVycm9yKTtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IFxuICAgICAgICBlcnJvcjogJ1VzZXIgcHJvZmlsZSBub3QgZm91bmQnLCBcbiAgICAgICAgZGV0YWlsczogcHJvZmlsZUVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGhpbnQ6IHByb2ZpbGVFcnJvci5oaW50XG4gICAgICB9LCB7IHN0YXR1czogNDA0IH0pO1xuICAgIH1cblxuICAgIGlmICghcHJvZmlsZSkge1xuICAgICAgY29uc29sZS5lcnJvcignTm8gcHJvZmlsZSBmb3VuZCBmb3IgdXNlcjonLCB1c2VyLmlkKTtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnRm91bmQgcHJvZmlsZTonLCBwcm9maWxlKTtcblxuICAgIC8vIEdldCB1c2VyJ3MgdGFncyB3aXRoIGNhbm9uaWNhbCB0YWcgaW5mbyBhbmQgc3RvcnkgY291bnRcbiAgICBjb25zdCB7IGRhdGE6IHVzZXJUYWdzLCBlcnJvcjogdGFnc0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ1VzZXJUYWcnKVxuICAgICAgLnNlbGVjdChgXG4gICAgICAgICosXG4gICAgICAgIHRhZzpDYW5vbmljYWxUYWcoKilcbiAgICAgIGApXG4gICAgICAuZXEoJ3VzZXJfaWQnLCBwcm9maWxlLnVzZXJfaWQpXG4gICAgICAub3JkZXIoJ2NyZWF0ZWRfYXQnLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XG5cbiAgICBpZiAodGFnc0Vycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB0YWdzOicsIHRhZ3NFcnJvcik7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggdGFncycsXG4gICAgICAgIGRldGFpbHM6IHRhZ3NFcnJvci5tZXNzYWdlLFxuICAgICAgICBoaW50OiB0YWdzRXJyb3IuaGludFxuICAgICAgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgc3RvcnkgY291bnRzIGZvciBlYWNoIHRhZ1xuICAgIGNvbnN0IHRhZ3NXaXRoQ291bnRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAodXNlclRhZ3MgfHwgW10pLm1hcChhc3luYyAodXNlclRhZykgPT4ge1xuICAgICAgICBjb25zdCB7IGNvdW50IH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgICAgIC5mcm9tKCdTdG9yeScpXG4gICAgICAgICAgLnNlbGVjdCgnKicsIHsgY291bnQ6ICdleGFjdCcsIGhlYWQ6IHRydWUgfSlcbiAgICAgICAgICAuZXEoJ3VzZXJfdGFnX2lkJywgdXNlclRhZy51c2VyX3RhZ19pZCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi51c2VyVGFnLFxuICAgICAgICAgIHN0b3J5X2NvdW50OiBjb3VudCB8fCAwXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24odGFnc1dpdGhDb3VudHMpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIEdFVCAvYXBpL3RhZ3M6JywgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59XG5cbi8vIFBPU1QgL2FwaS90YWdzIC0gQ3JlYXRlIGEgbmV3IHRhZyBmb3IgdGhlIGN1cnJlbnQgdXNlclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGF3YWl0IGNyZWF0ZUNsaWVudCgpO1xuICAgIFxuICAgIC8vIENoZWNrIGF1dGhlbnRpY2F0aW9uXG4gICAgY29uc3QgeyBkYXRhOiB7IHVzZXIgfSwgZXJyb3I6IGF1dGhFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKCk7XG4gICAgaWYgKGF1dGhFcnJvciB8fCAhdXNlcikge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCBib2R5XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xuICAgIGNvbnN0IHsgdGFnTmFtZSB9ID0gYm9keTtcblxuICAgIGlmICghdGFnTmFtZSB8fCB0eXBlb2YgdGFnTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVGFnIG5hbWUgaXMgcmVxdWlyZWQnIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm9ybWFsaXplIHRhZyBuYW1lIChsb3dlcmNhc2UsIHRyaW0pXG4gICAgY29uc3Qgbm9ybWFsaXplZFRhZ05hbWUgPSB0YWdOYW1lLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKG5vcm1hbGl6ZWRUYWdOYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdUYWcgbmFtZSBjYW5ub3QgYmUgZW1wdHknIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSB1c2VyJ3MgcHJvZmlsZVxuICAgIGNvbnN0IHsgZGF0YTogcHJvZmlsZSwgZXJyb3I6IHByb2ZpbGVFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCdVc2VyJylcbiAgICAgIC5zZWxlY3QoJ3VzZXJfaWQnKVxuICAgICAgLmVxKCd1c2VyX2lkJywgdXNlci5pZClcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIGlmIChwcm9maWxlRXJyb3IgfHwgIXByb2ZpbGUpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBjYW5vbmljYWwgdGFnIGV4aXN0c1xuICAgIGxldCB7IGRhdGE6IGNhbm9uaWNhbFRhZyB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCdDYW5vbmljYWxUYWcnKVxuICAgICAgLnNlbGVjdCgnKicpXG4gICAgICAuZXEoJ25hbWUnLCBub3JtYWxpemVkVGFnTmFtZSlcbiAgICAgIC5zaW5nbGUoKTtcblxuICAgIC8vIElmIGNhbm9uaWNhbCB0YWcgZG9lc24ndCBleGlzdCwgY3JlYXRlIGl0XG4gICAgaWYgKCFjYW5vbmljYWxUYWcpIHtcbiAgICAgIGNvbnN0IHsgZGF0YTogbmV3Q2Fub25pY2FsVGFnLCBlcnJvcjogY3JlYXRlRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAgIC5mcm9tKCdDYW5vbmljYWxUYWcnKVxuICAgICAgICAuaW5zZXJ0KHsgbmFtZTogbm9ybWFsaXplZFRhZ05hbWUgfSlcbiAgICAgICAgLnNlbGVjdCgpXG4gICAgICAgIC5zaW5nbGUoKTtcblxuICAgICAgaWYgKGNyZWF0ZUVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIGNhbm9uaWNhbCB0YWc6JywgY3JlYXRlRXJyb3IpO1xuICAgICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdGFnJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICAgICAgfVxuXG4gICAgICBjYW5vbmljYWxUYWcgPSBuZXdDYW5vbmljYWxUYWc7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGhhcyB0aGlzIHRhZ1xuICAgIGNvbnN0IHsgZGF0YTogZXhpc3RpbmdVc2VyVGFnIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ1VzZXJUYWcnKVxuICAgICAgLnNlbGVjdCgnKicpXG4gICAgICAuZXEoJ3VzZXJfaWQnLCBwcm9maWxlLnVzZXJfaWQpXG4gICAgICAuZXEoJ3RhZ19pZCcsIGNhbm9uaWNhbFRhZy50YWdfaWQpXG4gICAgICAuc2luZ2xlKCk7XG5cbiAgICBpZiAoZXhpc3RpbmdVc2VyVGFnKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1lvdSBhbHJlYWR5IGhhdmUgdGhpcyB0YWcnIH0sIHsgc3RhdHVzOiA0MDkgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHVzZXIgdGFnXG4gICAgY29uc3QgeyBkYXRhOiB1c2VyVGFnLCBlcnJvcjogdXNlclRhZ0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ1VzZXJUYWcnKVxuICAgICAgLmluc2VydCh7XG4gICAgICAgIHVzZXJfaWQ6IHByb2ZpbGUudXNlcl9pZCxcbiAgICAgICAgdGFnX2lkOiBjYW5vbmljYWxUYWcudGFnX2lkLFxuICAgICAgfSlcbiAgICAgIC5zZWxlY3QoYFxuICAgICAgICAqLFxuICAgICAgICB0YWc6Q2Fub25pY2FsVGFnKCopXG4gICAgICBgKVxuICAgICAgLnNpbmdsZSgpO1xuXG4gICAgaWYgKHVzZXJUYWdFcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY3JlYXRpbmcgdXNlciB0YWc6JywgdXNlclRhZ0Vycm9yKTtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIGNyZWF0ZSB1c2VyIHRhZycgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gd2l0aCBzdG9yeSBjb3VudCAoMCBmb3IgbmV3IHRhZ3MpXG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgLi4udXNlclRhZyxcbiAgICAgIHN0b3J5X2NvdW50OiAwXG4gICAgfTtcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihyZXN1bHQsIHsgc3RhdHVzOiAyMDEgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL3RhZ3M6JywgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59ICJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVDbGllbnQiLCJHRVQiLCJfcmVxdWVzdCIsInN1cGFiYXNlIiwiZGF0YSIsInVzZXIiLCJlcnJvciIsImF1dGhFcnJvciIsImF1dGgiLCJnZXRVc2VyIiwianNvbiIsInN0YXR1cyIsImNvbnNvbGUiLCJsb2ciLCJpZCIsInByb2ZpbGUiLCJwcm9maWxlRXJyb3IiLCJmcm9tIiwic2VsZWN0IiwiZXEiLCJzaW5nbGUiLCJkZXRhaWxzIiwibWVzc2FnZSIsImhpbnQiLCJ1c2VyVGFncyIsInRhZ3NFcnJvciIsInVzZXJfaWQiLCJvcmRlciIsImFzY2VuZGluZyIsInRhZ3NXaXRoQ291bnRzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsInVzZXJUYWciLCJjb3VudCIsImhlYWQiLCJ1c2VyX3RhZ19pZCIsInN0b3J5X2NvdW50IiwiUE9TVCIsInJlcXVlc3QiLCJib2R5IiwidGFnTmFtZSIsIm5vcm1hbGl6ZWRUYWdOYW1lIiwidHJpbSIsInRvTG93ZXJDYXNlIiwibGVuZ3RoIiwiY2Fub25pY2FsVGFnIiwibmV3Q2Fub25pY2FsVGFnIiwiY3JlYXRlRXJyb3IiLCJpbnNlcnQiLCJuYW1lIiwiZXhpc3RpbmdVc2VyVGFnIiwidGFnX2lkIiwidXNlclRhZ0Vycm9yIiwicmVzdWx0Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/tags/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabase/server.ts":
/*!********************************!*\
  !*** ./lib/supabase/server.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createClient: () => (/* binding */ createClient)\n/* harmony export */ });\n/* harmony import */ var _barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! __barrel_optimize__?names=createServerClient!=!@supabase/ssr */ \"(rsc)/__barrel_optimize__?names=createServerClient!=!./node_modules/@supabase/ssr/dist/module/index.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n\n\nasync function createClient() {\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    return (0,_barrel_optimize_names_createServerClient_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__.createServerClient)(\"https://zinencmbqximkrqfkjol.supabase.co\", \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbmVuY21icXhpbWtycWZram9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjYyMjIsImV4cCI6MjA2NzQwMjIyMn0.RBrnl_ksL9DHISglmeFKOicMlS9czl8xdgAKF7wHyxQ\", {\n        cookies: {\n            getAll () {\n                return cookieStore.getAll();\n            },\n            setAll (cookiesToSet) {\n                try {\n                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));\n                } catch  {\n                // The `setAll` method was called from a Server Component.\n                // This can be ignored if you have middleware refreshing\n                // user sessions.\n                }\n            }\n        },\n        auth: {\n            debug: \"development\" === 'development'\n        },\n        db: {\n            schema: 'public'\n        },\n        global: {\n            headers: {\n                'x-client-info': 'diino-server'\n            }\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2Uvc2VydmVyLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFrRDtBQUNaO0FBRS9CLGVBQWVFO0lBQ3BCLE1BQU1DLGNBQWMsTUFBTUYscURBQU9BO0lBRWpDLE9BQU9ELDBHQUFrQkEsQ0FDdkJJLDBDQUFvQyxFQUNwQ0Esa05BQXlDLEVBQ3pDO1FBQ0VILFNBQVM7WUFDUE87Z0JBQ0UsT0FBT0wsWUFBWUssTUFBTTtZQUMzQjtZQUNBQyxRQUFPQyxZQUFZO2dCQUNqQixJQUFJO29CQUNGQSxhQUFhQyxPQUFPLENBQUMsQ0FBQyxFQUFFQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxFQUFFLEdBQzVDWCxZQUFZWSxHQUFHLENBQUNILE1BQU1DLE9BQU9DO2dCQUVqQyxFQUFFLE9BQU07Z0JBQ04sMERBQTBEO2dCQUMxRCx3REFBd0Q7Z0JBQ3hELGlCQUFpQjtnQkFDbkI7WUFDRjtRQUNGO1FBQ0FFLE1BQU07WUFDSkMsT0FBT2Isa0JBQXlCO1FBQ2xDO1FBQ0FjLElBQUk7WUFDRkMsUUFBUTtRQUNWO1FBQ0FDLFFBQVE7WUFDTkMsU0FBUztnQkFDUCxpQkFBaUI7WUFDbkI7UUFDRjtJQUNGO0FBRUoiLCJzb3VyY2VzIjpbIi9Vc2Vycy9rZXZpbnJvc2UvTGlicmFyeS9DbG91ZFN0b3JhZ2UvRHJvcGJveC92aWJlL2RpaW5vL2xpYi9zdXBhYmFzZS9zZXJ2ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU2VydmVyQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3NzcidcbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tICduZXh0L2hlYWRlcnMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVDbGllbnQoKSB7XG4gIGNvbnN0IGNvb2tpZVN0b3JlID0gYXdhaXQgY29va2llcygpXG5cbiAgcmV0dXJuIGNyZWF0ZVNlcnZlckNsaWVudChcbiAgICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhLFxuICAgIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZISxcbiAgICB7XG4gICAgICBjb29raWVzOiB7XG4gICAgICAgIGdldEFsbCgpIHtcbiAgICAgICAgICByZXR1cm4gY29va2llU3RvcmUuZ2V0QWxsKClcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QWxsKGNvb2tpZXNUb1NldCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb29raWVzVG9TZXQuZm9yRWFjaCgoeyBuYW1lLCB2YWx1ZSwgb3B0aW9ucyB9KSA9PlxuICAgICAgICAgICAgICBjb29raWVTdG9yZS5zZXQobmFtZSwgdmFsdWUsIG9wdGlvbnMpXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBUaGUgYHNldEFsbGAgbWV0aG9kIHdhcyBjYWxsZWQgZnJvbSBhIFNlcnZlciBDb21wb25lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiBiZSBpZ25vcmVkIGlmIHlvdSBoYXZlIG1pZGRsZXdhcmUgcmVmcmVzaGluZ1xuICAgICAgICAgICAgLy8gdXNlciBzZXNzaW9ucy5cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYXV0aDoge1xuICAgICAgICBkZWJ1ZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCdcbiAgICAgIH0sXG4gICAgICBkYjoge1xuICAgICAgICBzY2hlbWE6ICdwdWJsaWMnXG4gICAgICB9LFxuICAgICAgZ2xvYmFsOiB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAneC1jbGllbnQtaW5mbyc6ICdkaWluby1zZXJ2ZXInXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIClcbn0iXSwibmFtZXMiOlsiY3JlYXRlU2VydmVyQ2xpZW50IiwiY29va2llcyIsImNyZWF0ZUNsaWVudCIsImNvb2tpZVN0b3JlIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwiZ2V0QWxsIiwic2V0QWxsIiwiY29va2llc1RvU2V0IiwiZm9yRWFjaCIsIm5hbWUiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJzZXQiLCJhdXRoIiwiZGVidWciLCJkYiIsInNjaGVtYSIsImdsb2JhbCIsImhlYWRlcnMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabase/server.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftags%2Froute&page=%2Fapi%2Ftags%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftags%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftags%2Froute&page=%2Fapi%2Ftags%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftags%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_tags_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/tags/route.ts */ \"(rsc)/./app/api/tags/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/tags/route\",\n        pathname: \"/api/tags\",\n        filename: \"route\",\n        bundlePath: \"app/api/tags/route\"\n    },\n    resolvedPagePath: \"/Users/kevinrose/Library/CloudStorage/Dropbox/vibe/diino/app/api/tags/route.ts\",\n    nextConfigOutput,\n    userland: _Users_kevinrose_Library_CloudStorage_Dropbox_vibe_diino_app_api_tags_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ0YWdzJTJGcm91dGUmcGFnZT0lMkZhcGklMkZ0YWdzJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGdGFncyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmtldmlucm9zZSUyRkxpYnJhcnklMkZDbG91ZFN0b3JhZ2UlMkZEcm9wYm94JTJGdmliZSUyRmRpaW5vJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUM4QjtBQUMzRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL2tldmlucm9zZS9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9Ecm9wYm94L3ZpYmUvZGlpbm8vYXBwL2FwaS90YWdzL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS90YWdzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvdGFnc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvdGFncy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9rZXZpbnJvc2UvTGlicmFyeS9DbG91ZFN0b3JhZ2UvRHJvcGJveC92aWJlL2RpaW5vL2FwcC9hcGkvdGFncy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftags%2Froute&page=%2Fapi%2Ftags%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftags%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/ws","vendor-chunks/whatwg-url","vendor-chunks/cookie","vendor-chunks/webidl-conversions","vendor-chunks/isows"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftags%2Froute&page=%2Fapi%2Ftags%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftags%2Froute.ts&appDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fkevinrose%2FLibrary%2FCloudStorage%2FDropbox%2Fvibe%2Fdiino&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();